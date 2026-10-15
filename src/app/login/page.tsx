// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthStep = "login" | "register" | "verify";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  
  const [step, setStep] = useState<AuthStep>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (step === "login") {
        // Standard Sign In
        await signIn("password", { email, password, flow: "signIn" });
        router.push("/"); // Redirect to home after login
        
      } else if (step === "register") {
        // Sign Up (Passes firstName and lastName to your profile callback in auth.ts)
        await signIn("password", { 
          email, 
          password, 
          firstName, 
          lastName, 
          flow: "signUp" 
        });
        // If successful, switch to OTP verification step
        setStep("verify");
        
      } else if (step === "verify") {
        // Submit the OTP code sent to email
        await signIn("password", { email, code, flow: "email-verification" });
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue. Vérifiez vos informations ou le code saisi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-card relative">
        
        <Link href="/" className="absolute top-6 left-6 text-muted hover:text-ink transition">
          <ArrowLeft size={20} />
        </Link>

        <div className="mb-8 text-center mt-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3552dc] to-[#5b75f0] text-white shadow-md shadow-brand/25 mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-ink">
            {step === "login" ? "Connexion" : step === "register" ? "Créer un compte" : "Vérification"}
          </h1>
          <p className="text-xs font-semibold text-muted mt-1">
            {step === "verify" 
              ? "Un code a été envoyé à votre adresse email." 
              : "Accédez à votre espace sécurisé Trustik"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fields for Login & Register */}
          {step !== "verify" && (
            <>
              {step === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase tracking-wider">Prénom</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase tracking-wider">Nom</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase tracking-wider">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </>
          )}

          {/* Fields for Verification Step */}
          {step === "verify" && (
            <div>
              <label className="block text-[11px] font-bold text-muted mb-1.5 uppercase tracking-wider">Code de vérification (OTP)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-2xl bg-page px-4 py-3 text-center text-xl tracking-widest font-black text-ink outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-danger text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-md shadow-brand/30 hover:bg-brand-deep transition active:scale-95 disabled:opacity-70 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : step === "verify" ? "Vérifier" : "Continuer"}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        {step !== "verify" && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setStep(step === "login" ? "register" : "login");
                setError("");
              }}
              className="text-xs font-bold text-muted hover:text-brand transition"
            >
              {step === "login" 
                ? "Pas encore de compte ? S'inscrire" 
                : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}