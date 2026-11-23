import { redirect } from "next/navigation";
import SessionService from "@/backend/SessionService";
import { HomeUnauthenticated } from "./HomeUnauthenticated";

/**
 * Signed-in users land on account security; everyone else sees the CTA.
 */
export default async function HomePage() {
  const session = await SessionService.current();
  if (session) {
    redirect("/account/security/");
  }
  return <HomeUnauthenticated />;
}
