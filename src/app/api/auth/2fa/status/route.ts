import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/lib/api";
import { db } from "@/models";
import { User } from "@/models/User";

const querySchema = z.object({
  email: z.string().email(),
});

/** Public check used by the login page. Never reveals whether the email exists. */
export const GET = apiHandler(async (req) => {
  const email = new URL(req.url).searchParams.get("email") || "";
  const { email: normalized } = querySchema.parse({ email });
  if (!db.initialized) await db.initialize();

  const user = await User.findOne({
    where: { email: normalized.toLowerCase() },
  });
  const enabled = Boolean(
    user?.twoFactorEnabled && user?.twoFactorSecret,
  );
  return NextResponse.json({ data: { enabled } });
});
