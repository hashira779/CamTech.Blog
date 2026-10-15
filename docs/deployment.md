# Production Deployment Guide

The live stack is `docker-compose.yml` on one Ubuntu host (`/home/ubuntu-server/CamTech.Blog`),
fronted by Cloudflare. `blog.camtech.cam` serves the Next.js site and `cms.camtech.cam` serves
the admin SPA, which also proxies `/api/` to the FastAPI container. GitHub Actions on a
self-hosted runner does `git reset --hard origin/main` then `docker compose up -d`.

## 1. One-time setup on the server: the secrets file

Compose reads a `.env` **next to `docker-compose.yml`** to substitute the `${VAR}` references in
that file. It is created by hand, once, and never committed. Create it before deploying the
hardened compose file, because every value below is required - a missing one stops `docker
compose up` with a named error rather than starting a container that signs admin sessions with a
key from the repository.

```bash
cd /home/ubuntu-server/CamTech.Blog
umask 077                       # the file we are about to create is readable only by its owner
touch .env
```

Fill `.env` with names only for now; generate each secret on the server and paste it into the
file directly (do not route a key through a chat window, a ticket, or a screenshot):

```
JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_urlsafe(48))">
SESSION_SECRET=<generate the same way>
POSTGRES_PASSWORD=<generate>
REDIS_PASSWORD=<generate>
MINIO_ROOT_USER=<a new access key, at least 3 characters>
MINIO_ROOT_PASSWORD=<generate, at least 8 characters>
PUBLIC_API_URL=https://cms.camtech.cam/api/v1
PUBLIC_WEB_URL=https://blog.camtech.cam
STORAGE_PROVIDER=minio
```

`database/seed_data.py` runs on every deploy and creates the first administrator. It only does so
when `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are in that file, and it prints the
address but never the password. Once the account exists, the seed leaves it alone - so after the
first successful deploy, remove both lines and create further editors through the admin UI, where
the password never touches a file:

```
BOOTSTRAP_ADMIN_EMAIL=<the address you sign in with>
BOOTSTRAP_ADMIN_PASSWORD=<generate a strong password, then delete these two lines>
```

**If this site has ever been seeded from a clone of this repository, change that account's
password now.** The seed script and the admin login page both carried a working super-admin
credential in committed source, and the login page shipped it inside a publicly downloadable
bundle. Treat `admin@dailydiscovery.com` as published: check whether it exists and is active,
then reset or deactivate it.

```bash
docker compose exec -T postgres psql -U discovery_user -d daily_discovery \
  -c "select email, role, is_active, is_superuser from users order by created_at;"
```

Then make sure git cannot track it, and confirm the file is not group/world readable:

```bash
git check-ignore -v .env && ls -l .env        # expect .gitignore:... and -rw-------
```

Changing `JWT_SECRET` invalidates every existing admin session: everyone signs in again. That is
the point when the previous key may have been read.

## 2. Deploy

```bash
docker compose pull 2>/dev/null || true
docker compose build --no-cache api web      # build args are baked into the images
docker compose up -d --remove-orphans
docker compose ps                            # every service should be healthy
```

`apps/api/.dockerignore` excludes `.env`, so the image carries no secrets: the container gets
them from this file at run time. If a deploy logs `Refusing to start: JWT_SECRET ...`, that is
the app doing its job - fix the `.env`, do not re-add a key to the repository.

## 3. What must not be reachable from the internet

Every published port in `docker-compose.yml` is bound to `127.0.0.1`, so the host's reverse proxy
still works and the public cannot reach the containers directly. Verify from outside, then on the
host:

```bash
ss -ltnp | grep -E ':(8000|3000|3001|5432|5435|6379|6389|9000|9001)\b'
# each line must show 127.0.0.1:..., never 0.0.0.0:... or *:...
```

A port bound to `0.0.0.0` bypasses Cloudflare for anyone who learns the origin IP. The two that
historically hurt people in this exact stack are an unauthenticated Redis (any client can write,
and `CONFIG SET` has a habit of becoming code execution) and a Postgres with a password that
lives in a public repository.

Keep a host firewall up as well (`ufw allow 80,443/tcp; ufw enable`), and if Cloudflare fronts the
site, consider restricting those two ports to Cloudflare's IP ranges so the origin only answers
requests that came through the edge.

## 4. Reverse proxy

The host nginx needs `blog.camtech.cam -> 127.0.0.1:3000` and `cms.camtech.cam ->
127.0.0.1:3001`. TLS is usually terminating at Cloudflare with the edge certificate; if you
terminate locally instead, use a real certificate - the admin SPA stores a session token in
browser storage, so plain HTTP on that host means anyone on the path can take it.

`infrastructure/loadbalancer/nginx.conf` is a multi-node reference (three web and three API
upstreams, `dailydiscovery.com`). It is **not** the config serving this site, and its
`server_name` does not match the live domains. Copy it and edit, or use it as documentation; do
not ship it as-is and expect traffic.

## 5. After a security change

1. Rotate anything that ever appeared in a commit or a chat: signing keys, database and MinIO
   credentials, AI provider keys. Deleting the file does not remove it from history.
2. Re-check the gates: `docker compose exec -T api pytest -q` and
   `curl -s https://cms.camtech.cam/health`.
3. Sign in to the admin once to confirm the session path still works, and re-run any autopilot
   job that depends on the AI provider configuration.

## 6. Database migrations

Alembic is wired: `docker compose exec -T api alembic upgrade head`. The API also applies an
in-process schema check at boot for local SQLite development; in production prefer Alembic and
keep `schema_migration` out of the critical path once it is confirmed against the live schema.
