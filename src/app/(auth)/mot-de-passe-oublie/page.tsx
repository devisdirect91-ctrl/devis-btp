"use client"

import { useState } from "react"
import Link from "next/link"
import { Barlow_Condensed, DM_Sans } from "next/font/google"
import { Mail, HardHat, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-barlow" })
const dm = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dm" })

const BLUEPRINT_DOT = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
  backgroundSize: "28px 28px",
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    // Simulate API call (implement actual email sending when ready)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className={`${barlow.variable} ${dm.variable} min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-12 relative overflow-hidden`}
      style={{ ...BLUEPRINT_DOT, fontFamily: "var(--font-dm)" }}>

      {/* Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:bg-orange-400 transition-colors">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-white text-xl" style={{ fontFamily: "var(--font-barlow)" }}>
              DEVIS<span className="text-orange-500">BTP</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8 sm:p-10">
            {!sent ? (
              <>
                <div className="mb-8">
                  <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-5">
                    <Mail className="w-7 h-7 text-orange-500" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
                    MOT DE PASSE OUBLIÉ ?
                  </h1>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Entrez votre adresse email. Nous vous enverrons un lien pour créer un nouveau mot de passe.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-5">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@entreprise.fr"
                        className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      "Envoyer le lien de réinitialisation"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3" style={{ fontFamily: "var(--font-barlow)" }}>
                  EMAIL ENVOYÉ !
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-2">
                  Si un compte existe pour{" "}
                  <strong className="text-slate-700">{email}</strong>,
                  vous recevrez un lien de réinitialisation dans quelques minutes.
                </p>
                <p className="text-slate-400 text-xs">
                  Vérifiez aussi vos spams.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-10 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour à la connexion
            </Link>
            <Link href="/register" className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
