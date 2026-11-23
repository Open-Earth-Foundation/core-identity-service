import { redirect } from "next/navigation";
import SessionService from "@/backend/SessionService";
import AccountSecurityForm from "./AccountSecurityForm";

/** Requires an OP session; otherwise send the user through login. */
export default async function AccountSecurityPage() {
  const session = await SessionService.current();
  if (!session) {
    redirect("/login/?returnTo=/account/security/");
  }
  return <AccountSecurityForm />;
}
