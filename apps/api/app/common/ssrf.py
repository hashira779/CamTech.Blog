import ipaddress
import socket
import urllib.parse
from typing import Optional, Tuple

BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "metadata.google.internal",
    "instance-data",
}

BLOCKED_IPS = {
    "169.254.169.254",  # AWS/GCP/Azure link-local metadata
    "fd00:ec2::254",    # AWS IPv6 metadata
}

def is_safe_ip(ip_str: str) -> bool:
    """
    Evaluates whether an IP address is a safe public target and not part of
    private, loopback, link-local, multicast, or cloud-metadata address spaces.
    """
    if ip_str in BLOCKED_IPS:
        return False

    try:
        ip = ipaddress.ip_address(ip_str)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return False
        return True
    except ValueError:
        return False

def validate_url_safe(url: str) -> Tuple[bool, str]:
    """
    Validates a URL against Server-Side Request Forgery (SSRF) vulnerabilities.
    Returns (is_safe, error_reason).
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception as e:
        return False, f"Malformed URL: {e}"

    # 1. Scheme check: only HTTP and HTTPS allowed
    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported scheme: {parsed.scheme}. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "Missing hostname in URL."

    hostname_clean = hostname.strip().lower()

    # 2. Blocked hostname list
    if hostname_clean in BLOCKED_HOSTS:
        return False, f"Host '{hostname_clean}' is prohibited by SSRF security policy."

    # 3. Direct IP address check
    try:
        ip = ipaddress.ip_address(hostname_clean)
        if not is_safe_ip(str(ip)):
            return False, f"Target IP {hostname_clean} is in a prohibited or private IP space."
    except ValueError:
        pass  # It is a domain name, resolve it next

    # 4. DNS resolution check (prevent DNS rebinding / internal resolves)
    try:
        # Resolve both IPv4 and IPv6
        addr_info = socket.getaddrinfo(hostname_clean, parsed.port or (443 if parsed.scheme == "https" else 80))
        for item in addr_info:
            ip_resolved = item[4][0]
            if not is_safe_ip(ip_resolved):
                return False, f"Domain '{hostname_clean}' resolved to prohibited IP '{ip_resolved}'."
    except socket.gaierror as e:
        return False, f"DNS resolution failed for '{hostname_clean}': {e}"
    except Exception as e:
        return False, f"Host validation error for '{hostname_clean}': {e}"

    return True, ""


class SSRFRejected(ValueError):
    """Raised in place of a request whose target — or one of whose redirect hops — is not public.

    A `ValueError` subclass so the existing `except Exception` handling in the image services keeps
    behaving the way it does today: the URL is simply not fetched and the caller keeps its original.
    """


MAX_REDIRECT_HOPS = 3
_REDIRECT_STATUSES = (301, 302, 303, 307, 308)


def require_public_url(url: str, *, field: str = "url") -> str:
    """The URL, if this process may talk to it. Raises `SSRFRejected` otherwise.

    Used on values that arrive from outside — a feed item's image, a Wikimedia search hit, an
    administrator-typed provider endpoint — because the checked-out answer to "where does this
    point" is never just a public website: `http://169.254.169.254/latest/meta-data/iam/` is the
    cloud role's credentials, and `http://127.0.0.1:6379/` is Redis on the same host.
    """
    is_safe, reason = validate_url_safe(url)
    if not is_safe:
        raise SSRFRejected(f"SSRF policy rejected {field}: {reason}")
    return url


def is_prohibited(url: str) -> bool:
    """True only for an address this process must not touch — a DNS failure is not one of them.

    `filter_live_images` deletes an image it cannot verify, and a development machine or a resolver
    outage must not be what empties a gallery. Only the two reasons that mean "we could not look"
    are treated as inconclusive; a private address, a metadata host, an unsupported scheme and a
    malformed URL are all definitive answers.
    """
    is_safe, reason = validate_url_safe(url)
    if is_safe:
        return False
    return not any(
        marker in reason
        for marker in ("DNS resolution failed", "Host validation error")
    )


# The hosts that hand out this machine's own credentials. `BLOCKED_HOSTS` above is the general
# policy for a URL somebody *else* chose, where localhost is forbidden because nothing a reader
# links to should live on our own network. A provider endpoint is chosen by the administrator and
# is allowed to be a model server on the same box, so only these two — and the link-local range
# they sit in — are refused here.
METADATA_HOSTS = {"metadata.google.internal", "instance-data"}
METADATA_IPS = {"169.254.169.254", "fd00:ec2::254"}


def validate_provider_endpoint(url: str) -> str:
    """Check an AI provider `base_url` an administrator just typed, without assuming it is public.

    A self-hosted model server is a legitimate answer — the built-in Ollama entry is
    `http://localhost:11434/v1` — so loopback and private ranges cannot be refused here. What can be
    refused is the one private target that pays for itself: the cloud metadata service, whose
    `/latest/meta-data/iam/security-credentials/` response is a set of role keys. The gateway POSTs
    to this URL with the provider's API key in the headers, so an endpoint saved by a stolen admin
    token should never be able to redirect that request on to the instance's own credentials.
    """
    try:
        parsed = urllib.parse.urlparse((url or "").strip())
    except Exception as exc:  # pragma: no cover - urlparse raises only on pathological input
        raise ValueError(f"Provider endpoint could not be parsed: {exc}")

    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError("Provider endpoint must be an http(s) URL")

    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("Provider endpoint has no host")

    if host in METADATA_HOSTS or host.endswith(".internal"):
        raise ValueError(f"Host '{host}' is not allowed as a provider endpoint")

    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return url  # a name: resolved by the operator's own DNS, and only checked for the blocklist

    # The link-local range is where the metadata service lives; `0.0.0.0` means "this host" to a
    # browser and something else entirely to a proxy, so it is refused for the same reason.
    if ip.is_link_local or ip.is_reserved or ip.is_unspecified or str(ip) in METADATA_IPS:
        raise ValueError(f"Provider endpoint must not target {host}")

    return url


async def guarded_get(client, url: str, *, headers: Optional[dict] = None, max_hops: int = MAX_REDIRECT_HOPS):
    """`client.get` with every hop validated.

    `follow_redirects=True` on a shared client is the part that used to defeat the gate: the URL
    handed to us was public, and the publisher's own 302 then walked the request to a private
    address the server fetched and, in the re-hosting services, stored. Redirects are followed
    here one hop at a time, and each target goes through `require_public_url` first.
    """
    current = require_public_url(url)
    response = None
    for _ in range(max(int(max_hops), 0) + 1):
        response = await client.get(current, headers=headers, follow_redirects=False)
        if response.status_code not in _REDIRECT_STATUSES:
            return response
        location = response.headers.get("location")
        if not location:
            return response
        # `urljoin` resolves a relative `Location: /next` against the hop we are actually on,
        # which is what a browser does — the alternative is fetching `/next` off the first host.
        current = require_public_url(urllib.parse.urljoin(str(response.url), location))
    return response
