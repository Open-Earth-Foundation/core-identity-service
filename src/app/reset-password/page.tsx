"use client";

import { TextField } from "@oef/gds-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCard, AuthSubmit, formValues, postJson } from "@/components/AuthCard";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  return (
    <AuthCard
      title="Choose a new password"
      footer={<Link href="/login/">Back to sign in</Link>}
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const values = formValues(event);
            const result = await postJson("/api/auth/password/reset/", {
              token: values.token || token,
              newPassword: values.newPassword,
              csrfToken,
            });
            if (!result.ok) {
              const err = result.data.error as { message?: string } | undefined;
              setError(err?.message || "Could not reset the password.");
              setBusy(false);
              return;
            }
            router.push("/reset-successful/");
          }}
        >
          <input type="hidden" name="token" value={token} />
          <TextField
            label="New password"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
          />
          <AuthSubmit busy={busy} disabled={!csrfToken || !token}>
            {busy ? "Saving…" : "Save password"}
          </AuthSubmit>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <p className="auth-lead">Loading…</p>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
