"use client";

import { Alert, Button } from "@oef/gds-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard, postJson } from "@/components/AuthCard";

type ClientInfo = {
  name: Record<string, string>;
  description: Record<string, string>;
};

/** What each scope lets the app do, in words a user can judge. */
const SCOPE_TEXT: Record<string, string> = {
  openid: "Know who you are: your account id, name and email address",
  read: "View your data",
  write: "Make changes to your data on your behalf",
};

/** Sends the browser back to the app with an OAuth error. */
function deniedUrl(redirectUri: string, state: string | null): string {
  const url = new URL(redirectUri);
  url.searchParams.set("error", "access_denied");
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

function ConsentForm() {
  const router = useRouter();
  const query = useSearchParams();

  const clientId = query.get("client_id") ?? "";
  const redirectUri = query.get("redirect_uri") ?? "";
  const scope = query.get("scope") ?? "";
  const state = query.get("state");
  const codeChallenge = query.get("code_challenge") ?? "";
  const nonce = query.get("nonce");

  const incomplete = !clientId || !redirectUri;
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [fetchError, setLoadError] = useState("");
  const loadError = incomplete
    ? "This authorization request is incomplete."
    : fetchError;

  // Needs a session. Without one, log in first and come back to this page.
  // The server also checks that the client and redirect URI are registered, so
  // an attacker cannot use this page to redirect to an arbitrary URL.
  useEffect(() => {
    if (incomplete) return;
    void (async () => {
      const res = await fetch(
        `/api/oauth/consent/?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        { credentials: "include" },
      );
      if (res.status === 401) {
        const returnTo = `/consent/?${query.toString()}`;
        router.replace(`/login/?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!res.ok) {
        setLoadError("This app or its redirect address is not registered.");
        return;
      }
      const body = (await res.json()) as { data: ClientInfo };
      setClient(body.data);
    })().catch(() => setLoadError("Could not load the request. Reload and try again."));
  }, [clientId, redirectUri, incomplete, query, router]);

  const scopes = scope.split(" ").filter(Boolean);
  const appName = client?.name.en ?? Object.values(client?.name ?? {})[0] ?? "This app";

  return (
    <AuthCard
      title="Authorize app"
      lead={client ? `${appName} wants access to your account.` : undefined}
    >
      {({ csrfToken, setError, busy, setBusy }) =>
        loadError ? (
          <Alert kind="critical" title={loadError} />
        ) : !client ? (
          <p className="auth-lead">Loading…</p>
        ) : (
          <div className="auth-form">
            <ul>
              {scopes.map((item) => (
                <li key={item}>{SCOPE_TEXT[item] ?? item}</li>
              ))}
            </ul>
            <Button
              disabled={busy || !csrfToken}
              className="auth-submit"
              onClick={async () => {
                setError("");
                setBusy(true);
                const result = await postJson("/api/oauth/consent/", {
                  csrfToken,
                  client_id: clientId,
                  redirect_uri: redirectUri,
                  scope,
                  state: state ?? undefined,
                  code_challenge: codeChallenge,
                  nonce: nonce ?? undefined,
                });
                const redirectUrl = result.data.redirectUrl as string | undefined;
                if (!result.ok || !redirectUrl) {
                  const err = result.data.error as { message?: string } | undefined;
                  setError(err?.message || "Could not authorize the app.");
                  setBusy(false);
                  return;
                }
                window.location.assign(redirectUrl);
              }}
            >
              {busy ? "Authorizing…" : "Allow"}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              className="auth-submit"
              onClick={() => window.location.assign(deniedUrl(redirectUri, state))}
            >
              Deny
            </Button>
          </div>
        )
      }
    </AuthCard>
  );
}

/** Consent page for OAuth clients that are not first party. */
export default function ConsentPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <ConsentForm />
    </Suspense>
  );
}
