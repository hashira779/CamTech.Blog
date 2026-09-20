import ipaddress
import socket
import urllib.parse
from typing import Tuple

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
