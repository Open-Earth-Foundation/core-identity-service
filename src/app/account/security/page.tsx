"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, formValues, postJson } from "@/components/AuthCard";

export default function AccountSecurityPage() {
  const router = useRouter();
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  return (
    <AuthCard
      title="Account security"
      lead="Change your password or manage two-factor authentication."
      footer={
        <>
          <Link href="/login/">Sign in</Link>
        </>
      }
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <>
          <h2 style={{ fontSize: "1.05rem" }}>Change password</h2>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setBusy(true);
              const values = formValues(event);
              const result = await postJson("/api/auth/password/change/", {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                csrfToken,
              });
              setBusy(false);
              if (!result.ok) {
                const err = result.data.error as { message?: string } | undefined;
                setError(err?.message || "Could not change password.");
                return;
              }
              setError("");
              event.currentTarget.reset();
              alert("Password changed.");
            }}
          >
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
            />
            <button type="submit" disabled={busy || !csrfToken}>
              Update password
            </button>
          </form>

          <h2 style={{ fontSize: "1.05rem", marginTop: "1.75rem" }}>Two-factor</h2>
          <button
            type="button"
            disabled={busy || !csrfToken}
            onClick={async () => {
              setError("");
              setBusy(true);
              const result = await postJson("/api/auth/2fa/setup/", { csrfToken });
              setBusy(false);
              if (!result.ok) {
                const err = result.data.error as { message?: string } | undefined;
                setError(err?.message || "Could not start 2FA setup.");
                return;
              }
              const data = result.data.data as { qrCodeDataUrl?: string };
              setQr(data.qrCodeDataUrl || null);
            }}
          >
            Start 2FA setup
          </button>
          {qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Authenticator QR code" style={{ width: "100%", margin: "1rem 0" }} />
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  const values = formValues(event);
                  const result = await postJson("/api/auth/2fa/verify/", {
                    token: values.token,
                    csrfToken,
                  });
                  setBusy(false);
                  if (!result.ok) {
                    const err = result.data.error as { message?: string } | undefined;
                    setError(err?.message || "Invalid code.");
                    return;
                  }
                  const data = result.data.data as { recoveryCodes?: string[] };
                  setRecoveryCodes(data.recoveryCodes || []);
                  setQr(null);
                }}
              >
                <label htmlFor="token">Authenticator code</label>
                <input id="token" name="token" type="text" required />
                <button type="submit" disabled={busy}>
                  Enable 2FA
                </button>
              </form>
            </>
          ) : null}
          {recoveryCodes ? (
            <div>
              <p className="lead">Save these recovery codes. They are shown once.</p>
              <ul>
                {recoveryCodes.map((code) => (
                  <li key={code}>
                    <code>{code}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form
            style={{ marginTop: "1.5rem" }}
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const values = formValues(event);
              const result = await postJson("/api/auth/2fa/disable/", {
                password: values.password,
                csrfToken,
              });
              setBusy(false);
              if (!result.ok) {
                const err = result.data.error as { message?: string } | undefined;
                setError(err?.message || "Could not disable 2FA.");
                return;
              }
              setRecoveryCodes(null);
              setQr(null);
              alert("2FA disabled.");
            }}
          >
            <label htmlFor="password">Password to disable 2FA</label>
            <input id="password" name="password" type="password" required />
            <button type="submit" disabled={busy || !csrfToken}>
              Disable 2FA
            </button>
          </form>

          <form
            style={{ marginTop: "1.5rem" }}
            onSubmit={async (event) => {
              event.preventDefault();
              await postJson("/api/auth/logout/", { csrfToken });
              router.push("/login/");
            }}
          >
            <button type="submit" disabled={!csrfToken}>
              Sign out
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
