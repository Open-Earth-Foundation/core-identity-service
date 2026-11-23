import { NextResponse } from "next/server";
import { z } from "zod";
import ClientService from "@/backend/oauth/ClientService";
import { requireAdmin } from "@/lib/admin";
import { apiHandler } from "@/lib/api";

/** Two-letter language code to text, as in the OAuthClientI18N table. */
const langMap = (maxLength: number) =>
  z.record(z.string().length(2), z.string().max(maxLength));

const newClientRequest = z.object({
  // A redirect URI may not carry a fragment (RFC 6749 section 3.1.2).
  redirectUris: z
    .array(
      z
        .string()
        .url()
        .max(2048)
        .refine((uri) => !uri.includes("#"), "No fragment allowed"),
    )
    .min(1)
    .max(20),
  name: langMap(64).refine((names) => Boolean(names.en), "An English name is required"),
  description: langMap(2000).optional(),
  // Send a secret to make a confidential client. Leave out for PKCE only.
  secret: z.string().min(16).max(256).optional(),
  firstParty: z.boolean().optional(),
});

/** Lists every registered client. Admin only. */
export const GET = apiHandler(async () => {
  await requireAdmin();
  return NextResponse.json({ data: await ClientService.list() });
});

/** Registers a client. Admin only. The secret is never returned or stored in clear. */
export const POST = apiHandler(async (req) => {
  await requireAdmin();
  const body = newClientRequest.parse(await req.json());

  const client = await ClientService.create(body);
  return NextResponse.json(
    { data: client },
    {
      status: 201,
      headers: { Location: `${new URL(req.url).origin}/api/admin/clients/${client.clientId}/` },
    },
  );
});
