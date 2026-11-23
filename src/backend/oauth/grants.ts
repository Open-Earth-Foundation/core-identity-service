import { OAuthClientAuthz } from "@/models/OAuthClientAuthz";

/**
 * Whether a user's authorization of an OAuth client is still in place. Reads
 * only. Use this to answer a question about a token (introspection), where
 * asking must not count as the app being used.
 *
 * Deleting an OAuth client deletes its grants (ON DELETE CASCADE), so an
 * active grant also means the client still exists.
 */
export async function hasActiveGrant(
  clientId: string,
  userId: string,
): Promise<boolean> {
  const grant = await OAuthClientAuthz.findOne({ where: { clientId, userId } });
  return grant !== null;
}

/**
 * Whether a user's authorization of an OAuth client is still in place, and
 * records that it was just used.
 *
 * This is what makes revoking an app take effect on the next refresh, even
 * though access tokens stay valid until they expire.
 */
export async function isGrantActive(
  clientId: string,
  userId: string,
): Promise<boolean> {
  const grant = await OAuthClientAuthz.findOne({ where: { clientId, userId } });
  if (!grant) return false;
  await grant.update({ lastUsed: new Date() });
  return true;
}

/**
 * Records a user's consent for a client, or refreshes `lastUsed` when it already
 * exists. Called when a code is issued after the consent screen.
 */
export async function recordGrant(
  clientId: string,
  userId: string,
): Promise<void> {
  await OAuthClientAuthz.upsert({ clientId, userId, lastUsed: new Date() });
}
