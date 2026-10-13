"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

type Mode = "signIn" | "signUp" | "verify";

const input =
  "w-full rounded-2xl bg-page px-4 py-3 font-semibold outline-none placeholder:font-medium placeholder:text-muted focus:ring-2 focus:ring-brand";
const button = "w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-50";

export function AuthForm() {
  const { signIn } = useAuthActions();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("signIn");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteEmail = params.get("email");
    if (inviteEmail) {
      setEmail(inviteEmail);
      setMode("signUp");
    }
  }, []);

  const cleanEmail = email.trim().toLowerCase();

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "verify") {
        await signIn("password", { email: cleanEmail, code: code.trim(), flow: "email-verification" });
        return;
      }
      const result =
        mode === "signUp"
          ? await signIn("password", { email: cleanEmail, password, firstName, lastName, flow: "signUp" })
          : await signIn("password", { email: cleanEmail, password, flow: "signIn" });
      // Not signed in yet means a verification code was sent to the email
      if (!result.signingIn) setMode("verify");
    } catch (err) {
      setError(
        mode === "verify"
          ? "Code invalide ou expiré"
          : mode === "signIn"
            ? "Email ou mot de passe incorrect"
            : errorMessage(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-sm overflow-hidden rounded-card bg-white shadow-card">
      <div className="bg-[linear-gradient(135deg,var(--color-brand),var(--color-brand-deep))] p-6 pb-8 text-white">
        <h1 className="text-3xl font-bold">{t.common.appTitle}</h1>
        <p className="mt-1 text-sm text-white/75">
          {mode === "signIn" && t.auth.signIn}
          {mode === "signUp" && t.auth.signUp}
          {mode === "verify" && `${t.auth.codeSentTo} ${cleanEmail}`}
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={submit} className="space-y-3">
          {mode === "signUp" && (
            <div className="flex gap-2">
              <input className={input} placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <input className={input} placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          )}
          {mode !== "verify" && (
            <>
              <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={input} type="password" placeholder="Mot de passe (8 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </>
          )}
          {mode === "verify" && (
            <input
              className={`${input} text-center text-xl tracking-widest`}
              inputMode="numeric" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value)} required
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className={button} disabled={busy}>
            {busy ? "…" : mode === "verify" ? "Vérifier" : mode === "signUp" ? "Créer le compte" : "Se connecter"}
          </button>
        </form>

        {mode !== "verify" && (
          <button
            className="mt-4 w-full text-sm font-semibold text-brand"
            onClick={() => { setError(null); setMode(mode === "signIn" ? "signUp" : "signIn"); }}
          >
            {mode === "signIn" ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
          </button>
        )}
      </div>
    </div>
  );
}