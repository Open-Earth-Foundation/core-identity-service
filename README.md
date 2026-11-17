# core-identity-service

Identity provider for the CityCatalyst / GCoM Data Service platform. It owns
credentials, two-factor authentication, sessions, and the OAuth 2.0 / OpenID
Connect protocol, so that CityCatalyst and other apps log in through one service.

Status: scaffold plus the database schema. The app builds and serves a health
endpoint. No identity logic has been moved here yet.

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Health check: `GET /api/health/` returns `{"status":"ok"}`. The trailing slash
matters because `trailingSlash` is on, to match CityCatalyst.

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

Tables: `User` (credentials and 2FA only), `OAuthClient`, `OAuthClientI18N`,
`OAuthClientAuthz`, `AuthorizationCode`, `RefreshToken`, `SigningKey`.
Authorization codes and refresh tokens are stored as SHA-256 hashes. The
private signing key is never stored in the database. `SigningKey` holds only
the public half for the JWKS.

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

## Where this comes from

The service is extracted from the OAuth authorization server that lives inside
[CityCatalyst](https://github.com/Open-Earth-Foundation/CityCatalyst) today.
Linear: CC-1185 (implementation) and CC-1178 (extraction spike).

The plan, gap list, and decisions are in
[`docs/core-identity-v0-extraction-plan.md`](./docs/core-identity-v0-extraction-plan.md).
Read it before changing anything here.

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
