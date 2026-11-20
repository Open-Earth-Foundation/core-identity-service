"use client";

import { Card } from "@oef/gds-react";
import Link from "next/link";

export default function ResetSuccessfulPage() {
  return (
    <div className="auth-shell">
      <Card
        className="auth-card"
        elevated
        eyebrow="CityCatalyst Identity"
        title="Password updated"
        footer={
          <div className="auth-footer">
            <Link href="/login/">Sign in</Link>
          </div>
        }
      >
        <p className="auth-lead">
          Your password has been changed. You can sign in now.
        </p>
      </Card>
    </div>
  );
}
