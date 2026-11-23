import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { createHash, generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { buildDiscoveryDocument } from "@/backend/oauth/discovery";
import AuthorizationCodeService from "@/backend/oauth/AuthorizationCodeService";
import AuthorizationService from "@/backend/oauth/AuthorizationService";
import ClientService, { ClientDto } from "@/backend/oauth/ClientService";
import RefreshTokenService from "@/backend/oauth/RefreshTokenService";
import { hasActiveGrant, recordGrant } from "@/backend/oauth/grants";
import { sha256Hex } from "@/lib/crypto";
import { verifyAccessToken } from "@/lib/oauth-signing";
import { db } from "@/models";
import { AuthorizationCode } from "@/models/AuthorizationCode";
import { OAuthClient } from "@/models/OAuthClient";
import { RefreshToken } from "@/models/RefreshToken";
import { User } from "@/models/User";
import { POST as tokenRoute } from "@/app/oauth/token/route";
import { POST as revokeRoute } from "@/app/oauth/revoke/route";

const hasDbCredentials = Boolean(
  process.env.DATABASE_NAME && process.env.DATABASE_USER,
);
const describeDb = hasDbCredentials ? describe : describe.skip;

const ISSUER = "http://localhost:3000";
const REDIRECT_URI = "http://localhost:4000/callback";

// A throwaway key, so the tests need no OAUTH_SIGNING_KEY in .env.
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.OAUTH_SIGNING_KEY = privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString();
process.env.OAUTH_ISSUER = ISSUER;
process.env.OAUTH_AUDIENCE = ISSUER;

/** PKCE S256 pair. */
function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** A form-encoded POST to a route handler. */
function formRequest(path: string, fields: Record<string, string>): Request {
  return new Request(`${ISSUER}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

/** Calls a route handler, which Next normally does with a params promise. */
const ctx = { params: Promise.resolve({}) };

describe("discovery document (no DB)", () => {
  it("lists the protocol endpoints under the issuer", () => {
    const doc = buildDiscoveryDocument(ISSUER);
    expect(doc.issuer).toBe(ISSUER);
    expect(doc.authorization_endpoint).toBe(`${ISSUER}/oauth/authorize/`);
    expect(doc.token_endpoint).toBe(`${ISSUER}/oauth/token/`);
    expect(doc.userinfo_endpoint).toBe(`${ISSUER}/oauth/userinfo/`);
    expect(doc.revocation_endpoint).toBe(`${ISSUER}/oauth/revoke/`);
    expect(doc.introspection_endpoint).toBe(`${ISSUER}/oauth/introspect/`);
    expect(doc.end_session_endpoint).toBe(`${ISSUER}/oauth/end-session/`);
    expect(doc.jwks_uri).toBe(`${ISSUER}/.well-known/jwks.json/`);
    expect(doc.code_challenge_methods_supported).toEqual(["S256"]);
  });
});

describeDb("OAuth protocol characterization (CC-1280)", () => {
  const suffix = randomUUID().slice(0, 8);
  let userId = "";
  let publicClient: ClientDto;
  let firstPartyClient: ClientDto;

  beforeAll(async () => {
    await db.initialize();
    const user = await User.create({
      userId: randomUUID(),
      email: `oauth-${suffix}@example.com`,
      name: "OAuth Tester",
    });
    userId = user.userId;

    publicClient = await ClientService.create({
      redirectUris: [REDIRECT_URI, "http://localhost:4000/other"],
      name: { en: `Test app ${suffix}` },
      description: { en: "Characterization client" },
    });
    firstPartyClient = await ClientService.create({
      redirectUris: [REDIRECT_URI],
      name: { en: `First party ${suffix}` },
      firstParty: true,
    });
  });

  afterAll(async () => {
    // Grants, codes, tokens, URIs and text go with the client (ON DELETE CASCADE).
    await OAuthClient.destroy({
      where: { clientId: [publicClient.clientId, firstPartyClient.clientId] },
    });
    await User.destroy({ where: { userId } });
    await db.close();
  });

  /** Issues a code the way the authorize endpoint does and exchanges it. */
  async function exchange(clientId: string, scope: string) {
    const { verifier, challenge } = pkce();
    const code = await AuthorizationCodeService.issue({
      clientId,
      userId,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
      scope,
      nonce: "n-123",
    });
    await recordGrant(clientId, userId);
    const res = await tokenRoute(
      formRequest("/oauth/token/", {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier,
      }),
      ctx,
    );
    return { res, code, verifier };
  }

  it("creates a client with several redirect URIs and no secret leak", async () => {
    expect(publicClient.redirectUris).toHaveLength(2);
    expect(publicClient.confidential).toBe(false);
    expect(publicClient.name.en).toContain("Test app");
    expect(firstPartyClient.firstParty).toBe(true);

    const row = await OAuthClient.findByPk(publicClient.clientId);
    // The legacy column holds the first URI.
    expect(row!.redirectURI).toBe(REDIRECT_URI);

    expect(
      await ClientService.findClientByRedirectUri(
        publicClient.clientId,
        "http://localhost:4000/other",
      ),
    ).not.toBeNull();
    expect(
      await ClientService.findClientByRedirectUri(
        publicClient.clientId,
        "http://localhost:4000/nope",
      ),
    ).toBeNull();
  });

  it("upserts a grant", async () => {
    expect(await hasActiveGrant(publicClient.clientId, userId)).toBe(false);
    await recordGrant(publicClient.clientId, userId);
    await recordGrant(publicClient.clientId, userId);
    expect(await hasActiveGrant(publicClient.clientId, userId)).toBe(true);
  });

  it("issues a code and exchanges it with PKCE for access, refresh and id tokens", async () => {
    const { res } = await exchange(publicClient.clientId, "openid read");
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.token_type).toBe("Bearer");
    expect(body.refresh_token).toBeTruthy();
    expect(body.id_token).toBeTruthy();

    const claims = verifyAccessToken(body.access_token, {
      issuer: ISSUER,
      audience: ISSUER,
    });
    expect(claims.sub).toBe(userId);
    expect(claims.client_id).toBe(publicClient.clientId);
    expect(claims.scope).toBe("openid read");
  });

  it("rejects a wrong PKCE verifier and spends the code", async () => {
    const { challenge } = pkce();
    const code = await AuthorizationCodeService.issue({
      clientId: publicClient.clientId,
      userId,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
      scope: "read",
    });
    const res = await tokenRoute(
      formRequest("/oauth/token/", {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: publicClient.clientId,
        code_verifier: "not-the-verifier",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
  });

  it("rotates refresh tokens and revokes the family when one is reused", async () => {
    const { res } = await exchange(publicClient.clientId, "read");
    const first = await res.json();

    const rotated = await tokenRoute(
      formRequest("/oauth/token/", {
        grant_type: "refresh_token",
        refresh_token: first.refresh_token,
        client_id: publicClient.clientId,
      }),
      ctx,
    );
    expect(rotated.status).toBe(200);
    const second = await rotated.json();
    expect(second.refresh_token).not.toBe(first.refresh_token);

    // Presenting the used token again is a replay: the family is revoked.
    const replay = await tokenRoute(
      formRequest("/oauth/token/", {
        grant_type: "refresh_token",
        refresh_token: first.refresh_token,
        client_id: publicClient.clientId,
      }),
      ctx,
    );
    expect(replay.status).toBe(400);

    const afterRevoke = await tokenRoute(
      formRequest("/oauth/token/", {
        grant_type: "refresh_token",
        refresh_token: second.refresh_token,
        client_id: publicClient.clientId,
      }),
      ctx,
    );
    expect(afterRevoke.status).toBe(400);
  });

  it("revokes the refresh-token family through the revoke endpoint", async () => {
    const { res } = await exchange(publicClient.clientId, "read");
    const tokens = await res.json();

    const revoked = await revokeRoute(
      formRequest("/oauth/revoke/", {
        token: tokens.refresh_token,
        client_id: publicClient.clientId,
      }),
      ctx,
    );
    expect(revoked.status).toBe(200);

    await expect(
      RefreshTokenService.rotate({
        token: tokens.refresh_token,
        clientId: publicClient.clientId,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("revokes the tokens of a code that is replayed", async () => {
    const { res, code, verifier } = await exchange(
      publicClient.clientId,
      "read",
    );
    const tokens = await res.json();

    // The code reserved the family its refresh token belongs to.
    const row = await AuthorizationCode.findByPk(sha256Hex(code));
    expect(row!.familyId).toBeTruthy();
    expect(
      await RefreshToken.count({ where: { familyId: row!.familyId! } }),
    ).toBe(1);

    await expect(
      AuthorizationCodeService.redeem({
        code,
        clientId: publicClient.clientId,
        redirectUri: REDIRECT_URI,
        codeVerifier: verifier,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      RefreshTokenService.rotate({
        token: tokens.refresh_token,
        clientId: publicClient.clientId,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  describe("authorization decisions", () => {
    const { challenge } = pkce();
    const base = {
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state: "xyz",
      code_challenge: challenge,
      code_challenge_method: "S256",
    };

    async function decide(
      clientId: string,
      session: string | null,
      extra: Record<string, string> = {},
    ) {
      const validated = await AuthorizationService.validateAuthorizeRequest({
        ...base,
        client_id: clientId,
        ...extra,
      });
      if ("redirectUrl" in validated) return validated;
      return AuthorizationService.decide(
        validated,
        session,
        "/oauth/authorize/?x=1",
        "x=1",
      );
    }

    it("refuses an unregistered redirect URI without redirecting", async () => {
      await expect(
        decide(publicClient.clientId, null, {
          redirect_uri: "http://evil.example/cb",
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("redirects a request without PKCE back to the client with an error", async () => {
      const result = await decide(publicClient.clientId, null, {
        code_challenge_method: "plain",
      });
      expect(result.redirectUrl).toContain("error=invalid_request");
      expect(result.redirectUrl).toContain("state=xyz");
    });

    it("sends a signed-out user to login, or answers login_required for prompt=none", async () => {
      const login = await decide(publicClient.clientId, null);
      expect(login.redirectUrl).toMatch(/^\/login\/\?returnTo=/);

      const silent = await decide(publicClient.clientId, null, {
        prompt: "none",
      });
      expect(silent.redirectUrl).toContain("error=login_required");
    });

    it("sends a new user of a third-party client to consent", async () => {
      // Use a client the user has not agreed to yet.
      const fresh = await ClientService.create({
        redirectUris: [REDIRECT_URI],
        name: { en: `Fresh ${suffix}` },
      });
      try {
        const consent = await decide(fresh.clientId, userId);
        expect(consent.redirectUrl).toBe("/consent/?x=1");

        const silent = await decide(fresh.clientId, userId, {
          prompt: "none",
        });
        expect(silent.redirectUrl).toContain("error=consent_required");
      } finally {
        await ClientService.delete(fresh.clientId);
      }
    });

    it("issues a code at once for a first-party client or an existing grant", async () => {
      const firstParty = await decide(firstPartyClient.clientId, userId);
      expect(firstParty.redirectUrl).toContain(`${REDIRECT_URI}?code=`);
      expect(firstParty.redirectUrl).toContain("state=xyz");
      expect(await hasActiveGrant(firstPartyClient.clientId, userId)).toBe(true);

      const granted = await decide(publicClient.clientId, userId, {
        prompt: "none",
      });
      expect(granted.redirectUrl).toContain(`${REDIRECT_URI}?code=`);
    });
  });
});
