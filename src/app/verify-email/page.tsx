"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Verify() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [message, setMessage] = useState(
    token ? "Verifying…" : "Missing verification token.",
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
          setMessage("Email verified. You can sign in.");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setMessage(data.error?.message || "Verification failed.");
      })
      .catch(() => {
        if (!cancelled) setMessage("Verification failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="shell">
      <div className="card">
        <h1>Email verification</h1>
        <p className="lead">{message}</p>
        <div className="links">
          <Link href="/login/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="shell">Loading…</div>}>
      <Verify />
    </Suspense>
  );
}
