"use client";

import { Checkbox, TextField } from "@oef/gds-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthSubmit, formValues, postJson } from "@/components/AuthCard";

export default function SignupPage() {
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <AuthCard
      title="Create an account"
      lead="We will email you a verification link."
      footer={<Link href="/login/">Already have an account?</Link>}
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            if (!acceptTerms) {
              setError("Accept the terms of use to continue.");
              return;
            }
            setBusy(true);
            const values = formValues(event);
            const result = await postJson("/api/auth/register/", {
              name: values.name,
              email: values.email,
              password: values.password,
              confirmPassword: values.confirmPassword,
              acceptTerms: true,
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
          <TextField label="Name" name="name" type="text" required />
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            description="At least 4 characters with upper, lower, and a number"
          />
          <TextField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
          />
          <Checkbox
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          >
            I accept the terms of use
          </Checkbox>
          <AuthSubmit busy={busy} disabled={!csrfToken}>
            {busy ? "Creating…" : "Create account"}
          </AuthSubmit>
        </form>
      )}
    </AuthCard>
  );
}
