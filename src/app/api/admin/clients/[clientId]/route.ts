import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import ClientService from "@/backend/oauth/ClientService";
import { requireAdmin } from "@/lib/admin";
import { apiHandler } from "@/lib/api";

/** One client. Admin only. */
export const GET = apiHandler(async (_req, ctx) => {
  await requireAdmin();
  const { clientId } = await ctx.params;

  const client = await ClientService.get(clientId);
  if (!client) throw createHttpError.NotFound("No client with that id");
  return NextResponse.json({ data: client });
});

/** Deletes a client with its grants, codes and refresh tokens. Admin only. */
export const DELETE = apiHandler(async (_req, ctx) => {
  await requireAdmin();
  const { clientId } = await ctx.params;

  if (!(await ClientService.delete(clientId))) {
    throw createHttpError.NotFound("No client with that id");
  }
  return new NextResponse(null, { status: 204 });
});
