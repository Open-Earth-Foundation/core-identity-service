"use client";

import { Alert, Button, Card } from "@oef/gds-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";

type Props = {
  title: string;
  lead?: string;
  children: (ctx: {
    csrfToken: string;
    setError: (message: string) => void;
    busy: boolean;
    setBusy: (busy: boolean) => void;
  }) => ReactNode;
  footer?: ReactNode;
};

/** Loads a CSRF token and wraps auth forms in a GDS Card. */
export function AuthCard({ title, lead, children, footer }: Props) {
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/csrf/", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { csrfToken?: string }) => {
        if (data.csrfToken) setCsrfToken(data.csrfToken);
      })
      .catch(() =>
        setError("Could not prepare the form. Reload and try again."),
      );
  }, []);

  return (
    <div className="auth-shell">
      <Card
        className="auth-card"
        elevated
        eyebrow="CityCatalyst Identity"
        title={title}
        footer={footer ? <div className="auth-footer">{footer}</div> : undefined}
      >
        {lead ? <p className="auth-lead">{lead}</p> : null}
        {error ? (
          <Alert kind="critical" title={error} className="auth-alert" />
        ) : null}
        {children({ csrfToken, setError, busy, setBusy })}
      </Card>
    </div>
  );
}

export async function postJson(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export function formValues(event: FormEvent<HTMLFormElement>) {
  const form = new FormData(event.currentTarget);
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export function AuthSubmit({
  busy,
  disabled,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="submit" disabled={busy || disabled} className="auth-submit">
      {children}
    </Button>
  );
}
