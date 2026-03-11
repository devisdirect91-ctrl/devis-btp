"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Barlow_Condensed, DM_Sans } from "next/font/google"
import { Mail, Lock, Eye, EyeOff, HardHat, ArrowRight, Loader2, AlertCircle, User, Building2, Phone } from "lucide-react"
import { AuthRightPanel } from "@/components/auth/AuthRightPanel"

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-barlow" })
const dm = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dm" })

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères min.", ok: password.length >= 8 },
    { label: "Majuscule", ok: /[A-Z]/.test(password) },
    { label: "Chiffre", ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ["bg-red-400", "bg-amber-400", "bg-emerald-500"]
  const labels = ["Faible", "Moyen", "Fort"]

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] font-medium transition-colors ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-bold ${colors[score - 1].replace("bg-", "text-")}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [shake, setShake] = useState(false)
  const [cgu, setCgu] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    if (!cgu) {
      setError("Vous devez accepter les CGU pour continuer.")
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password,
        companyName: formData.get("companyName") || undefined,
        phone: formData.get("phone") || undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || "Une erreur est survenue. Réessayez.")
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }

    // Auto sign in after registration
    await signIn("credentials", {
      email: formData.get("email"),
      password,
      redirect: false,
    })

    router.push("/dashboard")
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <span className="text-orange-600 text-xs font-semibold">Essai 14 jours — sans carte bancaire</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-2"
              style={{ fontFamily: "var(--font-barlow)" }}>
              CRÉEZ VOTRE<br />COMPTE GRATUIT
            </h1>
            <p className="text-slate-500 text-sm">
              Prêt en 2 minutes. Vos premiers devis pro vous attendent.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-5 ${shake ? "animate-shake" : ""}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Nom de l&apos;entreprise
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Dupont Plomberie (optionnel)"
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Nom complet <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Email professionnel <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jean@dupont-plomberie.fr"
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 text-slate-900 border rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm placeholder:text-slate-300 bg-slate-50 focus:bg-white ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:ring-red-500/30 focus:border-red-500"
                      : confirmPassword && confirmPassword === password
                        ? "border-emerald-300 focus:ring-emerald-500/30 focus:border-emerald-500"
                        : "border-slate-200 focus:ring-orange-500/30 focus:border-orange-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* CGU */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={cgu}
                onChange={(e) => setCgu(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/30 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                J&apos;accepte les{" "}
                <a href="#" className="text-orange-500 hover:underline font-medium">CGU</a>
                {" "}et la{" "}
                <a href="#" className="text-orange-500 hover:underline font-medium">politique de confidentialité</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !cgu}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création du compte…
                </>
              ) : (
                <>
                  Créer mon compte gratuit
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
              Se connecter →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right — Visual ──────────────────────────────────────────── */}
      <AuthRightPanel variant="register" />

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
