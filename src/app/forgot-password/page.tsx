"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, formValues, postJson } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <AuthCard
      title="Forgot password"
      lead="If an account exists for that email, we will send a reset link."
      footer={<Link href="/login/">Back to sign in</Link>}
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const values = formValues(event);
            const result = await postJson("/api/auth/password/forgot/", {
              email: values.email,
              csrfToken,
            });
            if (!result.ok) {
              const err = result.data.error as { message?: string } | undefined;
              setError(err?.message || "Request failed.");
              setBusy(false);
              return;
            }
            router.push("/check-email/");
          }}
        >
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <button type="submit" disabled={busy || !csrfToken}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
