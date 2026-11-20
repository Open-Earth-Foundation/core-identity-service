"use client";

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

/** Loads a CSRF token and wraps a simple auth form card. */
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
      .catch(() => setError("Could not prepare the form. Reload and try again."));
  }, []);

  return (
    <div className="shell">
      <div className="card">
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {children({ csrfToken, setError, busy, setBusy })}
        {footer ? <div className="links">{footer}</div> : null}
      </div>
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
