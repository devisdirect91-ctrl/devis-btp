"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Barlow_Condensed, DM_Sans } from "next/font/google"
import { Mail, Lock, Eye, EyeOff, HardHat, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { AuthRightPanel } from "@/components/auth/AuthRightPanel"

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-barlow" })
const dm = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dm" })

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "true"

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.")
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className={`${barlow.variable} ${dm.variable} min-h-screen grid lg:grid-cols-2`} style={{ fontFamily: "var(--font-dm)" }}>

      {/* ── Left — Form ─────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 sm:px-10 xl:px-16 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg" style={{ fontFamily: "var(--font-barlow)" }}>
              DEVIS<span className="text-orange-500">BTP</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-2"
              style={{ fontFamily: "var(--font-barlow)" }}>
              BON RETOUR<br />PARMI NOUS !
            </h1>
            <p className="text-slate-500 text-sm">
              Connectez-vous pour accéder à vos devis et clients.
            </p>
          </div>

          {/* Success banner */}
          {justRegistered && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl mb-6">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-sm font-medium">
                Compte créé avec succès ! Connectez-vous maintenant.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 ${shake ? "animate-shake" : ""}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@entreprise.fr"
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Mot de passe
                </label>
                <Link href="/mot-de-passe-oublie"
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                name="remember"
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/30 cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                Se souvenir de moi
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
              Essai gratuit 14 jours →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right — Visual ──────────────────────────────────────────── */}
      <AuthRightPanel variant="login" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
