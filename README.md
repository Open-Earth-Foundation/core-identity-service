# core-identity-service

Identity provider for the CityCatalyst / GCoM Data Service platform. It owns
credentials, two-factor authentication, sessions, and the OAuth 2.0 / OpenID
Connect protocol, so that CityCatalyst and other apps log in through one service.

Status: credential login, registration, password reset/change, email verify,
2FA setup/verify/disable, and opaque OP sessions are implemented (CC-1279).
The OAuth protocol core (discovery, JWKS, authorize, token, userinfo, revoke,
introspect, consent, client admin, grants) is implemented (CC-1280).

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
cp env.example .env   # fill DATABASE_* and IDENTITY_ENCRYPTION_KEY
docker compose up -d  # Postgres on localhost:5440
npm run db:migrate
npm run dev           # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

Health check: `GET /api/health/` returns `{"status":"ok"}`. The trailing slash
matters because `trailingSlash` is on, to match CityCatalyst.

### Design system (GDS)

Auth UI uses the [GDS design system](https://open-earth-foundation.github.io/gds-ds/?path=/story/overview--welcome)
(`@oef/gds-tokens`, `@oef/gds-react`). Packages are not on a registry yet, so
built `v0.1.0` artifacts are vendored under `vendor/@oef/` (see
`vendor/README.md`). Swap to GitHub Packages when they publish.

### Auth locally (CC-1279)

Pages (English, GDS components — not a Chakra port):

| Path | Purpose |
|------|---------|
| `/login/` | Sign in (password + optional TOTP/recovery code) |
| `/signup/` | Register and send verify email |
| `/forgot-password/` | Enumeration-safe reset email |
| `/reset-password/?token=…` | Consume reset `EmailToken` |
| `/verify-email/?token=…` | Consume verify `EmailToken` |
| `/check-email/` | “Check your inbox” interstitial |
| `/reset-successful/` | After a successful reset |
| `/account/security/` | Change password and manage 2FA |

API surface under `/api/auth/` (see `docs/architecture.md` §4.1): login, logout,
register, password forgot/reset/change, email verify, 2FA setup/verify/disable/
status, CSRF issue.

Session cookie `op_session` is HttpOnly, SameSite=Lax, Secure in production. Only
the SHA-256 hash is stored in `Session`. CSRF uses cookie `op_csrf` + form token.

### Env vars for auth

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_*` | yes | Identity Postgres (see below) |
| `PUBLIC_ORIGIN` | yes | Base URL for verify/reset links (no trailing slash) |
| `IDENTITY_ENCRYPTION_KEY` | yes | 32-byte key, base64 — seals TOTP secrets (AES-256-GCM) |
| `CSRF_SECRET` | recommended | HMAC secret for CSRF tokens |
| `TOTP_ISSUER` | optional | Label in authenticator apps |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | optional | When unset, mail goes to an in-memory sink and is logged |

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`RESET_TOKEN_SECRET` is **not** used — reset and verify use single-use
`EmailToken` rows. bcrypt cost is **12** everywhere; passwords longer than 72
bytes are rejected.

Login is rate-limited to **5 attempts per email per 15 minutes** via
`LoginRateLimit`.

### OAuth / OpenID Connect (CC-1280)

| Path | Purpose |
|------|---------|
| `/.well-known/openid-configuration/`, `/.well-known/oauth-authorization-server/` | Discovery |
| `/.well-known/jwks.json/` | Public signing key |
| `/oauth/authorize/` | Authorization endpoint (reads the `op_session` cookie) |
| `/oauth/token/`, `/oauth/revoke/`, `/oauth/introspect/` | Token endpoints |
| `/oauth/userinfo/` | Profile claims (Bearer token) |
| `/oauth/end-session/` | RP-initiated logout (clears `op_session`) |
| `/consent/` | Consent page for clients that are not first party |
| `/api/admin/clients/`, `/api/admin/clients/{clientId}/` | Client administration (admin only) |
| `/api/account/grants/`, `/api/account/grants/{clientId}/` | List and revoke the user's grants |

`post_logout_redirect_uri` on end-session must exactly match a registered
redirect URI for the given `client_id` (register the RP login URL too).

Every request needs PKCE (`S256`). A client with a secret authenticates with
HTTP Basic; one without is a public client. First-party clients skip consent.
`prompt=none` answers `login_required` or `consent_required` instead of showing
a page. Redirect URIs live in `OAuthClientRedirectUri` and must match exactly.

| Variable | Required | Notes |
|----------|----------|-------|
| `OAUTH_SIGNING_KEY` | yes | RSA private key (PEM, 2048 bits or more) that signs tokens |
| `OAUTH_ISSUER` | optional | `iss` of tokens. Default: `PUBLIC_ORIGIN` |
| `OAUTH_AUDIENCE` | optional | `aud` of access tokens. Default: `PUBLIC_ORIGIN` |
| `OAUTH_RESOURCE_SERVERS` | optional | `id:secret,id:secret` allowed to introspect. None set: nobody may |
| `IDENTITY_ADMIN_EMAILS` | optional | Verified admin emails or `@domain` suffixes for `/api/admin/clients/` |

## Database

The service has its own Postgres database. It has no foreign keys to
CityCatalyst. `User.user_id` is the same UUID as in CityCatalyst, so it is the
OpenID `sub`.

```bash
cp env.example .env        # then fill in DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
docker compose up -d       # Postgres on localhost:5440, created with those values
npm run db:migrate
npm run db:migrate:undo    # undo the last migration
```

The values are not committed. For local development any values work.
`docker compose` stops with a clear message if they are blank.

Tables: `User` (credentials and 2FA only), `Session`, `EmailToken`,
`LoginRateLimit`, `OAuthClient`, `OAuthClientI18N`, `OAuthClientRedirectUri`, `OAuthClientAuthz`,
`AuthorizationCode`, `RefreshToken`, `SigningKey`.
Authorization codes, refresh tokens, and session/email tokens are stored as
SHA-256 hashes. The private signing key is never stored in the database.
`SigningKey` holds only the public half for the JWKS. TOTP secrets are sealed
with AES-256-GCM when written through this service.

Models are in `src/models`. Use them through `db`:

```ts
import { db } from "@/models";

await db.initialize();
const user = await db.models!.User.findByPk(userId);
```

### Copying data from CityCatalyst

`npm run db:copy-from-citycatalyst` copies users (with credentials and 2FA
data), OAuth clients, translations and grants. Set `CITYCATALYST_DATABASE_*`
in `.env` first.

```bash
npm run db:copy-from-citycatalyst             # dry run, writes nothing
npm run db:copy-from-citycatalyst -- --apply  # writes
```

- CityCatalyst is read in a read-only transaction. The script cannot change it.
- The dry run does the same inserts and rolls them back, so its counts are what
  an apply would do.
- Existing rows in the identity database are never overwritten, so running it
  again is safe. A password changed here after the first copy stays.
- `--apply` commits only if every source row ends up in the identity database.
  If one cannot be copied (for example an email that already belongs to another
  user), nothing is written and the script exits with 1.
- Output has counts and user ids only. No emails, hashes or secrets.

Back up the identity database before running with `--apply` on a shared one.

## Docker

```bash
docker build --tag core-identity-service .
docker run --rm -p 3000:3000 core-identity-service
```

The image uses Next.js standalone output and runs as a non-root user (uid
1001). `.env` files are excluded from the build context, so configuration is
passed in at runtime.

## CI and deployment (draft, CC-1282)

- `.github/workflows/ci.yml` runs lint, typecheck, test, build and a Docker
  build on pull requests. Pushes to `develop` also publish the image to
  `ghcr.io/open-earth-foundation/core-identity-service` as `:<sha>` and
  `:latest`.
- `k8s/dev/core-identity.yml` is a draft Deployment and Service with probes on
  `/api/health/`. It has not been applied to any cluster.
- `.github/workflows/deploy-dev.yml` deploys a chosen image tag to the dev
  cluster. It is manual only and fails at the first step until the cluster
  secrets (`AWS_ACCESS_KEY_ID_EKS_DEV_USER`, `AWS_SECRET_ACCESS_KEY_EKS_DEV_USER`,
  `EKS_DEV_NAME`) are added to this repository.
- Not decided yet: the namespace, the ingress paths on the shared origin, and
  where the identity database runs. The dev ingress lives in the CityCatalyst
  repository.

## Where this comes from

The service is extracted from the OAuth authorization server that lives inside
[CityCatalyst](https://github.com/Open-Earth-Foundation/CityCatalyst) today.
Linear: CC-1185 (implementation) and CC-1178 (extraction spike).

The plan, gap list, and decisions are in
[`docs/core-identity-v0-extraction-plan.md`](./docs/core-identity-v0-extraction-plan.md).
Read it before changing anything here.

How the service is built (components, data model, flows, security, open
decisions) is in [`docs/architecture.md`](./docs/architecture.md).

## Direction

- Next.js for the MVP. The first goal is to extract the existing logic and check
  that it works on its own, not to rewrite it.
- Separate database. No foreign keys to the CityCatalyst database.
- CityCatalyst keeps a `User` profile row keyed by the identity `sub`. All
  authentication logic lives here.
- Pages are meant to be composed into the main app by route mapping on one
  origin, not by iframes.

## Order of work

The signing-key split and the JWKS cutover happen in CityCatalyst first. Code
moves into this repository after that. See "Extraction order" in the plan.

## License

AGPL-3.0, the same as CityCatalyst. See [LICENSE](./LICENSE).
