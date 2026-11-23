"use client";

import { TextField } from "@oef/gds-react";
import Link from "next/link";
import { AuthCard, AuthSubmit, formValues, postJson } from "@/components/AuthCard";
import { safeReturnTo } from "@/lib/safe-return-to";

export default function LoginForm() {
  return (
    <AuthCard
      title="Sign in"
      lead="Use your email and password. If you use an authenticator, enter the code too."
      footer={
        <>
          <Link href="/signup/">Create an account</Link>
          <Link href="/forgot-password/">Forgot password</Link>
        </>
      }
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const values = formValues(event);
            try {
              const check = await fetch(
                `/api/auth/2fa/status/?email=${encodeURIComponent(values.email || "")}`,
                { credentials: "include" },
              );
              const status = (await check.json()) as {
                data?: { enabled?: boolean };
              };
              if (status.data?.enabled && !values.securityToken) {
                setError("Enter your authenticator or recovery code.");
                setBusy(false);
                return;
              }

              const result = await postJson("/api/auth/login/", {
                ...values,
                csrfToken,
              });
              if (!result.ok) {
                const err = result.data.error as { message?: string } | undefined;
                setError(err?.message || "Sign-in failed.");
                setBusy(false);
                return;
              }
              // returnTo brings the user back to /oauth/authorize or /consent
              // after login. Only a path on this site is accepted.
              const returnTo = new URLSearchParams(window.location.search).get(
                "returnTo",
              );
              window.location.assign(safeReturnTo(returnTo));
            } catch {
              setError("Sign-in failed.");
              setBusy(false);
            }
          }}
        >
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="username"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <TextField
            label="Authenticator or recovery code"
            name="securityToken"
            type="text"
            autoComplete="one-time-code"
            description="Only if two-factor authentication is enabled"
          />
          <AuthSubmit busy={busy} disabled={!csrfToken}>
            {busy ? "Signing in…" : "Sign in"}
          </AuthSubmit>
        </form>
      )}
    </AuthCard>
  );
}
