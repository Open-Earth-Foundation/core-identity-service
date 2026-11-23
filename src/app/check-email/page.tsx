"use client";

import { Card } from "@oef/gds-react";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="auth-shell">
      <Card
        className="auth-card"
        elevated
        eyebrow="OpenEarth Identity"
        title="Check your email"
        footer={
          <div className="auth-footer">
            <Link href="/login/">Back to sign in</Link>
          </div>
        }
      >
        <p className="auth-lead">
          If we need anything from you, a message is on its way. The link expires
          in one hour.
        </p>
      </Card>
    </div>
  );
}
