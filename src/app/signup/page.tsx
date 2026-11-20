"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, formValues, postJson } from "@/components/AuthCard";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthCard
      title="Create an account"
      lead="We will email you a verification link."
      footer={<Link href="/login/">Already have an account?</Link>}
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const values = formValues(event);
            const result = await postJson("/api/auth/register/", {
              name: values.name,
              email: values.email,
              password: values.password,
              confirmPassword: values.confirmPassword,
              acceptTerms: values.acceptTerms === "on",
              csrfToken,
            });
            if (!result.ok) {
              const err = result.data.error as { message?: string } | undefined;
              setError(err?.message || "Could not create the account.");
              setBusy(false);
              return;
            }
            router.push("/check-email/");
          }}
        >
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
          />

          <label className="check">
            <input name="acceptTerms" type="checkbox" required />
            <span>I accept the terms of use</span>
          </label>

          <button type="submit" disabled={busy || !csrfToken}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
