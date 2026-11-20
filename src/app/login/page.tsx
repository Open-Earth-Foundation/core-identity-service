"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, formValues, postJson } from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();

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
              router.push("/account/security/");
            } catch {
              setError("Sign-in failed.");
              setBusy(false);
            }
          }}
        >
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />

          <label htmlFor="securityToken">Authenticator or recovery code (if enabled)</label>
          <input id="securityToken" name="securityToken" type="text" autoComplete="one-time-code" />

          <button type="submit" disabled={busy || !csrfToken}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
