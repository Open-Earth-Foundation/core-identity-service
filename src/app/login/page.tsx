import { redirect } from "next/navigation";
import SessionService from "@/backend/SessionService";
import { safeReturnTo } from "@/lib/safe-return-to";
import LoginForm from "./LoginForm";

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

/** Already signed-in users skip the form and resume OAuth / account. */
export default async function LoginPage({ searchParams }: Props) {
  const session = await SessionService.current();
  if (session) {
    const params = await searchParams;
    redirect(safeReturnTo(params.returnTo));
  }
  return <LoginForm />;
}
