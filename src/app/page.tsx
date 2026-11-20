"use client";

import { Button, Card } from "@oef/gds-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="auth-shell">
      <Card
        className="auth-card"
        elevated
        eyebrow="CityCatalyst Identity"
        title="Sign in to continue"
        footer={
          <div className="auth-footer">
            <Link href="/signup/">Create an account</Link>
          </div>
        }
      >
        <p className="auth-lead">
          Credential login, 2FA, and account flows for the GCoM Digital Service.
        </p>
        <Button
          className="auth-submit"
          render={<Link href="/login/" />}
        >
          Sign in
        </Button>
      </Card>
    </div>
  );
}
