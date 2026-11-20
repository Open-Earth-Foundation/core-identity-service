import Link from "next/link";

export default function ResetSuccessfulPage() {
  return (
    <div className="shell">
      <div className="card">
        <h1>Password updated</h1>
        <p className="lead">Your password has been changed. You can sign in now.</p>
        <div className="links">
          <Link href="/login/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
