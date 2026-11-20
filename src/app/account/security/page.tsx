"use client";

import { Alert, Button, TextField } from "@oef/gds-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthSubmit, formValues, postJson } from "@/components/AuthCard";

export default function AccountSecurityPage() {
  const router = useRouter();
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <AuthCard
      title="Account security"
      lead="Change your password or manage two-factor authentication."
      footer={<Link href="/login/">Sign in</Link>}
    >
      {({ csrfToken, setError, busy, setBusy }) => (
        <>
          {notice ? (
            <Alert kind="good" title={notice} className="auth-alert" />
          ) : null}

          <section className="auth-section">
            <h2 className="auth-section-title">Change password</h2>
            <form
              className="auth-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");
                setNotice("");
                setBusy(true);
                const values = formValues(event);
                const result = await postJson("/api/auth/password/change/", {
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                  csrfToken,
                });
                setBusy(false);
                if (!result.ok) {
                  const err = result.data.error as
                    | { message?: string }
                    | undefined;
                  setError(err?.message || "Could not change password.");
                  return;
                }
                event.currentTarget.reset();
                setNotice("Password changed.");
              }}
            >
              <TextField
                label="Current password"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
              <TextField
                label="New password"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
              />
              <AuthSubmit busy={busy} disabled={!csrfToken}>
                Update password
              </AuthSubmit>
            </form>
          </section>

          <section className="auth-section">
            <h2 className="auth-section-title">Two-factor</h2>
            <div className="auth-form">
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !csrfToken}
                onClick={async () => {
                  setError("");
                  setNotice("");
                  setBusy(true);
                  const result = await postJson("/api/auth/2fa/setup/", {
                    csrfToken,
                  });
                  setBusy(false);
                  if (!result.ok) {
                    const err = result.data.error as
                      | { message?: string }
                      | undefined;
                    setError(err?.message || "Could not start 2FA setup.");
                    return;
                  }
                  const data = result.data.data as { qrCodeDataUrl?: string };
                  setQr(data.qrCodeDataUrl || null);
                }}
              >
                Start 2FA setup
              </Button>

              {qr ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt="Authenticator QR code"
                    className="auth-qr"
                  />
                  <form
                    className="auth-form"
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
                        const err = result.data.error as
                          | { message?: string }
                          | undefined;
                        setError(err?.message || "Invalid code.");
                        return;
                      }
                      const data = result.data.data as {
                        recoveryCodes?: string[];
                      };
                      setRecoveryCodes(data.recoveryCodes || []);
                      setQr(null);
                      setNotice("Two-factor authentication is enabled.");
                    }}
                  >
                    <TextField
                      label="Authenticator code"
                      name="token"
                      type="text"
                      required
                      autoComplete="one-time-code"
                    />
                    <AuthSubmit busy={busy}>Enable 2FA</AuthSubmit>
                  </form>
                </>
              ) : null}

              {recoveryCodes ? (
                <div>
                  <p className="auth-lead">
                    Save these recovery codes. They are shown once.
                  </p>
                  <ul className="auth-recovery-list">
                    {recoveryCodes.map((code) => (
                      <li key={code}>
                        <code>{code}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form
                className="auth-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setNotice("");
                  const values = formValues(event);
                  const result = await postJson("/api/auth/2fa/disable/", {
                    password: values.password,
                    csrfToken,
                  });
                  setBusy(false);
                  if (!result.ok) {
                    const err = result.data.error as
                      | { message?: string }
                      | undefined;
                    setError(err?.message || "Could not disable 2FA.");
                    return;
                  }
                  setRecoveryCodes(null);
                  setQr(null);
                  setNotice("2FA disabled.");
                }}
              >
                <TextField
                  label="Password to disable 2FA"
                  name="password"
                  type="password"
                  required
                />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={busy || !csrfToken}
                  className="auth-submit"
                >
                  Disable 2FA
                </Button>
              </form>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  await postJson("/api/auth/logout/", { csrfToken });
                  router.push("/login/");
                }}
              >
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={!csrfToken}
                  className="auth-submit"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </section>
        </>
      )}
    </AuthCard>
  );
}
