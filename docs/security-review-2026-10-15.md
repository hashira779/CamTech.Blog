# Security review - 2026-10-15

Scope: the FastAPI backend, the Next.js public site, the Vite admin SPA, the Docker/compose
deployment, the CI workflow and the seed data. Method: read every path that takes input from
outside the app (RSS feeds, AI output, uploads, admin forms, URLs the server is asked to fetch),
then reproduce what an attacker would send as a failing test before changing the code. Public
endpoints were probed read-only over HTTPS; no credentials were submitted and no state was
changed on the live site.

Everything below marked "fixed" is in the working tree and **not committed**.

## 1. Fixed in code

### The admin credential was published in three places
`database/seed_data.py` created a `SUPER_ADMIN` account with a password written in the file and
printed that password on every run - and the CI pipeline runs that script on every deploy. The
admin login page also carried a button that filled both the address and the password into the
form, so the credential shipped inside a bundle downloadable from `cms.camtech.cam` by anyone.
Both are gone: the seed now reads `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` from the
environment, creates nothing without them, prints the address but never the password, and never
touches an existing account's password. A test walks the source tree and fails if that credential
or either burned signing key reappears anywhere except the denylist that refuses to boot on them.

### Infrastructure credentials left the deploy file
`docker-compose.yml` contained the Postgres password, the Redis URL and the MinIO root user and
password as literals, and baked `apps/api/.env` into the API image with `COPY . .`. Every
credential is now a required substitution from a file that lives only on the server
(`${JWT_SECRET:?...}` etc.), so a missing value stops `docker compose up` with a named error
instead of starting a container that signs sessions with a key from the repository.
`apps/api/.dockerignore` now excludes `.env`, and `apps/api/.env.example` documents every name
with placeholders only.

### Ports that used to face the internet
The stack published `3000`, `3001`, `8000`, `5435`, `6389`, `9000` and `9001` on every interface.
A published port is reachable past Cloudflare by anyone who learns the origin IP, and two of
those were an unauthenticated Redis and a database whose password is in git. All published ports
in the production file are now bound to `127.0.0.1`, which is all the host's reverse proxy and an
SSH tunnel need; containers keep talking to each other over the docker network. Redis also starts
with `--requirepass`. `tests/test_deploy_hygiene.py` reads the compose files as data and fails if
any port goes back to `0.0.0.0`, if a credential literal returns, or if the API containers stop
declaring `APP_ENV=production`.

### The production container was running as a development server
Nothing in the compose file set `APP_ENV`, and the `.env` committed to the repository says
`development` - so the live container had interactive API docs, a full OpenAPI schema, debug
reloading and the loopback CORS origins trusted. `docker-compose.yml` now forces
`APP_ENV=production` and `DEBUG=false` for `api` and `worker`, and `docker-compose.dev.yml` asks
for `development` explicitly so laptops keep their docs.

Measured, not assumed: `https://cms.camtech.cam/docs` and `/openapi.json` currently return the
admin SPA's HTML (323 bytes, `text/html`), because that host only proxies `/api/`, `/health`,
`/ready` and `/live` - so the docs were **not** reachable from the internet through the domain.
They were reachable on the API's own port, which is the path the loopback binding now closes.

### CORS
`allow_credentials` was `True`. Nothing in the API ever calls `set_cookie` (grep across
`apps/api/app` returns no match) and no client uses `withCredentials`, so it bought no
functionality and only decided what a stray origin could do with an admin's cookies. It is now
`False`; `Authorization: Bearer` keeps working because that header is not a CORS credential.
The four `http://localhost:*` origins are also dropped from the list whenever the environment is
live, including when `FRONTEND_URL` still points at one, because a forgotten default is the
ordinary way a production API ends up trusting a laptop. `tests/test_cors_policy.py` (23 tests)
covers both answers to "is this live?", the middleware the running app actually installed, and
real preflights from an allowed and a disallowed origin.

### Stored XSS, on both sides of the wire
Feeds and AI output are HTML, and they were stored roughly as they arrived. There is now a
store-side sanitizer (`app/common/html_hygiene.py`) applied at every write - the RSS producer, the
CMS article path, AI news, guides, discoveries, the worker drafts and the manual fetch - plus the
renderer allowlist in `apps/web/src/lib/sanitize.ts` and `safeHref` / `safeImageSrc` guards in the
admin SPA (`apps/admin/src/lib/sanitize.ts`). The renderer cannot trust the row and the row cannot
trust the renderer. Links that survive are forced to `target="_blank"` with
`rel="noopener noreferrer nofollow ugc"`, so a syndicated feed cannot frame-bust or open its
opener. `tests/test_ingestion_hygiene.py` (56 tests) runs 21 executable-markup payloads,
entity-decoded and control-character schemes, protocol-relative URLs, and checks that ordinary
editorial prose such as `40 < 50 per cent` is not rewritten as markup, that real markup survives,
and that the sanitizer is idempotent. The browser-side battery is `node scripts/security-checks.mjs`
in `apps/web`: 90 checks.

### SSRF - the server was an open proxy for whoever supplied the URL
Every URL the app fetches on somebody else's instructions now goes through
`app/common/ssrf.py`: the two re-hosting services (S3/MinIO and Google Drive uploads from a URL),
the place-image liveness gate, single-image sync, and provider `base_url` at save time. Cloud
metadata addresses (`169.254.169.254`, `fd00:ec2::254`, `metadata.google.internal`) are refused,
redirects are followed one hop at a time with each hop re-validated, and no `follow_redirects=True`
is left in application code. A test proves a `302` aimed at `127.0.0.1:6379` never opens a socket
(`client.requested == [the public URL]`). Where the check cannot reach a verdict - a DNS failure
offline - the gate stays inconclusive rather than declaring a real photo dead, so a gallery can
never be emptied by a bad network. `validate_provider_endpoint` still allows a local Ollama
endpoint, because that is how a self-hosted model is configured; it refuses metadata, link-local
and reserved addresses. `tests/test_ssrf_guard.py`: 34 tests.

### Authentication and the admin surface (earlier in this pass)
Signing keys no longer have defaults, and a key that once lived in this repository is refused at
boot (`_BURNED_SECRETS` plus `Refusing to start`). The destructive routes - database migration,
storage provider edits, feed re-indexing and friends - are restricted to real super-admins: 12
routes now answer 403 for an `EDITOR` and 401 for an anonymous caller. The rate limiter can no
longer be dodged by presenting a bot user-agent, and stored AI/storage credentials are returned
masked. `tests/test_admin_authz.py`: 68 tests.

## 2. Do these on the server, in this order

The code changes above are safe on their own, but deploying them in the wrong order takes the site
down, because the container no longer inherits a signing key from the repository.

1. On the server, create `/home/ubuntu-server/CamTech.Blog/.env` (chmod 600) with fresh
   `JWT_SECRET`, `SESSION_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_USER`,
   `MINIO_ROOT_PASSWORD`, plus `PUBLIC_API_URL=https://cms.camtech.cam/api/v1`. Generate keys on
   the server; do not paste them into a chat, a ticket or a screenshot.
2. Change the password of the seeded `admin@dailydiscovery.com` account, or deactivate it. Anyone
   who has read the repository has read it. Confirm with
   `docker compose exec -T postgres psql -U discovery_user -d daily_discovery -c "select email, role, is_active from users;"`
3. Push, then `docker compose build --no-cache api web && docker compose up -d --remove-orphans`.
   Rebuilding `web` matters: `NEXT_PUBLIC_API_URL` is inlined at build time, and the image was
   built with the Dockerfile's `http://localhost:8000` default.
4. Verify from the host: `ss -ltnp | grep -E ':(8000|3000|3001|5432|5435|6379|6389|9000|9001)\b'`
   must show `127.0.0.1:` on every line. Sign in to the admin once.
5. Then remove `BOOTSTRAP_ADMIN_*` from the file, and add `.env` to the server's git exclude list.

Full steps: `docs/deployment.md`.

## 3. Left for you to decide

**`apps/api/.env` is still tracked, and HEAD still holds the old signing keys.** Your working copy
has fresh ones; committing them would publish them again. The clean break is
`git rm --cached apps/api/.env` plus a history purge (`git filter-repo`) and rotation - rotation is
what actually removes the risk, since history keeps the old value either way. Say the word and I
will prepare the commands; I have not touched the index.

**A CSP is missing on both sites.** Live headers on `blog.camtech.cam` carry
`nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, HSTS and `Permissions-Policy`
(Next.js config) but no `Content-Security-Policy`; `cms.camtech.cam` gets its headers from
Cloudflare or the origin nginx and showed none of them in a raw `HEAD`. A CSP is the header that
would have made the stored-XSS payloads above non-executable, so it is worth adding - but it needs
`unsafe-inline` for Next.js styles or a nonce setup, and a wrong value breaks the site. I would
start it reporting-only (`Content-Security-Policy-Report-Only`) for a week.

**The admin token lives in `localStorage`.** That is readable by any script that gets to run on
`cms.camtech.cam`, which is exactly why the sanitizing work above matters. The alternative is an
`HttpOnly` `SameSite=Strict` session cookie - but that reintroduces CSRF as the thing to solve and
needs `allow_credentials` back on. Current design plus a CSP is defensible; changing it is a
bigger job than this pass.

**Next.js 16.3.5 is under a critical advisory bundle; the fix is 16.4.1.** `npm audit --omit=dev`
in `apps/web` reports 3 vulnerabilities (1 critical, 2 high). The critical one covers
`next 16.0.0 - 16.3.7` with seven advisories, and three of them describe this deployment exactly:
Server-Side Request Forgery in Image Optimization (GHSA-cjq9-62q9-8jv4 - `/_next/image` is enabled
here, which is why the `remotePatterns` allowlist was tightened in `next.config.ts`), cache
poisoning of SSG and ISR pages **in self-hosted applications** (GHSA-4jqv-mc3x-m676 - this is a
self-hosted compose stack), and Remote Code Execution in `next/og ImageResponse`. Also listed: a
Draft Mode content leak into persisted pages, information disclosure through
`dynamicParams` metadata image routes, and information disclosure in the dev server's MCP
endpoint. The other two are `sharp <0.35.5` (librsvg, CVE-2026-96889) and `source-map-js`
(event-loop DoS). `npm audit fix` cannot reach `next@16.4.1` because it is outside the declared
range, so it is a deliberate `package.json` edit plus a rebuild - which I have not done, because
verifying it needs `next build` and a dev-server restart, both of which you asked me to leave
alone. `apps/admin` reports 0 vulnerabilities. Python-side advisories were **not** machine-checked:
`pip-audit` is not installed here.

**`requirements.txt` pins nothing.** Every line is `>=`, so each image build takes whatever is
newest. The local set is behind (`fastapi 0.135.1` vs `0.143.1`, `uvicorn 0.41.0` vs `0.54.0`,
`Pillow 12.1.1` vs `12.3.0`, `cryptography 50.0.1` vs `50.0.2`) while an unpinned build may jump
majors nobody reviewed (`starlette` 1.x and `sqlalchemy` 2.1 exist and are allowed by these
ranges). Pin to the set the suite passes against, then let `pip-audit` or a dependency bot open
the upgrade PRs.

**`admin@dailydiscovery.com` is still the seeded address in the docs and the login placeholder's
old value.** Once its password is rotated it is not a vulnerability, but a name an attacker starts
with.

**Header trust depends on the port binding being real.** The limiter and audit log read
`CF-Connecting-IP` / `X-Forwarded-For`, which a visitor may set to anything if they can reach
port 8000 directly. The loopback binding removes that path; if you ever publish `8000` again, the
API must instead accept those headers only from Cloudflare's ranges.

**Not security, but found while verifying:** `npx tsc --noEmit` in `apps/web` currently reports 3
errors in three untracked files - `components/tools/DnsLookupInspector.tsx:189` and
`KnowledgeSearchTool.tsx:203` pass a `hint` prop that `FormFieldProps` does not declare, and
`lib/exchange-rate.ts:43` assigns `null` to a `string`. They predate this pass and are unrelated
to it; the admin type-check and the API suite are clean.

## 4. Evidence

| Check | Result |
| --- | --- |
| `python -m pytest -q` in `apps/api` | **333 passed** (195 before this security pass) |
| New security tests | hygiene 56, SSRF 34, CORS 23, deploy hygiene 25, admin authz 68 |
| `node scripts/security-checks.mjs` (apps/web) | **90/90** |
| `npx tsc -p tsconfig.app.json --noEmit` (admin) | clean |
| `npx tsc --noEmit` (web) | 3 pre-existing errors, listed above |
| `npm audit --omit=dev` (apps/web) | 3 vulnerabilities: `next` 16.0.0-16.3.7 critical, `sharp` high, `source-map-js` high |
| `npm audit --omit=dev` (apps/admin) | 0 vulnerabilities |
| Live header probe `blog.camtech.cam` | nosniff, SAMEORIGIN, Referrer-Policy, HSTS, Permissions-Policy present; no CSP |
| Live probe `cms.camtech.cam/docs`, `/openapi.json` | 200 but 323-byte SPA HTML - API docs not reachable through that host |
| Live probe `cms.camtech.cam/api/v1/articles` | 200 JSON (the only public API proxy); `blog.camtech.cam/api/v1/...` is 404 |
| Working tree | 44 files changed, +1120/-248, nothing committed |

Not verified, and worth a look after the deploy: `docker compose config` (no Docker on this
machine, so the interpolation and healthcheck syntax was validated by parsing the YAML and reading
the rules, not by a real run); Python dependency advisories (`pip-audit` is not installed here);
whether the host firewall blocks the origin IP directly; whether the seeded admin account exists in
the production database, which only a query on the server can answer.
