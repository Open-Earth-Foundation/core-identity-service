"use client";

import { Alert, Card } from "@oef/gds-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Verify() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [message, setMessage] = useState(
    token ? "Verifying…" : "Missing verification token.",
  );
  const [kind, setKind] = useState<"info" | "good" | "critical">(
    token ? "info" : "critical",
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetch(`/api/auth/email/verify/?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          setKind("good");
          setMessage("Email verified. You can sign in.");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setKind("critical");
        setMessage(data.error?.message || "Verification failed.");
      })
      .catch(() => {
        if (!cancelled) {
          setKind("critical");
          setMessage("Verification failed.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-shell">
      <Card
        className="auth-card"
        elevated
        eyebrow="OpenEarth Identity"
        title="Email verification"
        footer={
          <div className="auth-footer">
            <Link href="/login/">Sign in</Link>
          </div>
        }
      >
        <Alert kind={kind} title={message} />
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <p className="auth-lead">Loading…</p>
        </div>
      }
    >
      <Verify />
    </Suspense>
  );
}
