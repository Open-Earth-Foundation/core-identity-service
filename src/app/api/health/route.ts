import { NextResponse } from "next/server";

// Liveness probe for k8s and CI smoke tests. It does not touch the database,
// so it stays green while the service is up even if Postgres is not.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
