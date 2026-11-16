# core-identity-service

Identity provider for the CityCatalyst / GCoM Data Service platform. It owns
credentials, two-factor authentication, sessions, and the OAuth 2.0 / OpenID
Connect protocol, so that CityCatalyst and other apps log in through one service.

Status: scaffold only. The app builds and serves a health endpoint. No identity
code has been moved here yet.

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
