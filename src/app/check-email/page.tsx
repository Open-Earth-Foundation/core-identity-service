import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="shell">
      <div className="card">
        <h1>Check your email</h1>
        <p className="lead">
          If we need anything from you, a message is on its way. The link expires
          in one hour.
        </p>
        <div className="links">
          <Link href="/login/">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
