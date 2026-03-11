"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  X, ChevronRight, ChevronLeft, FileText, ShieldCheck, PenLine,
  CheckCircle2, Loader2, AlertCircle, Receipt
} from "lucide-react"
import { SignaturePad } from "./SignaturePad"

const UNITE_LABELS: Record<string, string> = {
  UNITE: "u", HEURE: "h", JOUR: "j", METRE: "m",
  METRE_CARRE: "m²", METRE_CUBE: "m³", METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait", ENSEMBLE: "Ens.", KILOGRAMME: "kg", TONNE: "t", LITRE: "L",
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export interface SignatureModalLigne {
  ligneType: string
  designation: string
  description?: string | null
  quantite: number
  unite: string
  prixUnitaireHT: number
  totalHtNet: number
}

export interface SignatureModalDevis {
  numero: string
  titre: string
  dateEmission: string
  dateValidite?: string | null
  totalHT: number
  totalRemise: number
  totalTva: number
  totalTTC: number
  remiseGlobale: number
  remiseGlobaleType: string
  acompte: number
  acompteType: string
  conditionsPaiement?: string | null
  delaiExecution?: string | null
  notes?: string | null
  mentionsLegales?: string | null
}

interface Props {
  token: string
  devis: SignatureModalDevis
  lignes: SignatureModalLigne[]
  artisanNom?: string | null
  primaryColor?: string
  onSuccess: (signatairenom: string) => void
  onClose: () => void
}

type Step = "recap" | "terms" | "sign" | "confirm"

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "recap",   label: "Récapitulatif", icon: Receipt },
  { id: "terms",   label: "Engagements",   icon: ShieldCheck },
  { id: "sign",    label: "Signature",     icon: PenLine },
  { id: "confirm", label: "Confirmation",  icon: CheckCircle2 },
]

export function SignatureModal({ token, devis, lignes, artisanNom, primaryColor = "#1d4ed8", onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>("recap")
  const [term1, setTerm1] = useState(false)
  const [term2, setTerm2] = useState(false)
  const [nom, setNom] = useState("")
  const [signatureB64, setSignatureB64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const acompteMontant = devis.acompteType === "PERCENT"
    ? Math.round(devis.totalTTC * (devis.acompte / 100) * 100) / 100
    : Math.min(devis.acompte, devis.totalTTC)
  const netAPayer = Math.round((devis.totalTTC - acompteMontant) * 100) / 100
  const hasRemise = devis.totalRemise > 0.005
  const mainLines = lignes.filter((l) => l.ligneType === "LINE")

  const handleConfirmSign = async () => {
    if (!signatureB64) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPTE",
          nom: nom.trim(),
          signatureBase64: signatureB64,
          acceptedTerms: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue")
        setLoading(false)
        return
      }
      onSuccess(nom.trim())
    } catch {
      setError("Erreur réseau. Réessayez.")
      setLoading(false)
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Signature du devis"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Signer le devis</h2>
            <p className="text-xs text-slate-500 mt-0.5">{devis.numero} · {devis.titre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done = i < stepIndex
              const active = i === stepIndex
              const Icon = s.icon
              return (
                <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "text-white"
                      : done
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-400 bg-slate-50"
                  }`} style={active ? { backgroundColor: primaryColor } : {}}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < stepIndex ? "bg-emerald-200" : "bg-slate-100"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-slate-100 flex-shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1 : RECAP ─────────────────────────────────────── */}
          {step === "recap" && (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Prestations</p>
                <div className="space-y-2">
                  {mainLines.slice(0, 8).map((l, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-slate-800 font-medium leading-snug">{l.designation}</p>
                        {l.description && <p className="text-slate-400 text-xs mt-0.5 truncate">{l.description}</p>}
                        <p className="text-slate-400 text-xs mt-0.5">
                          {l.quantite} {UNITE_LABELS[l.unite] ?? l.unite} × {eur(l.prixUnitaireHT)}
                        </p>
                      </div>
                      <span className="text-slate-700 font-semibold flex-shrink-0 tabular-nums">{eur(l.totalHtNet)}</span>
                    </div>
                  ))}
                  {mainLines.length > 8 && (
                    <p className="text-xs text-slate-400 italic">+ {mainLines.length - 8} autre(s) prestation(s) — voir le devis complet</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Total HT</span><span>{eur(devis.totalHT)}</span>
                </div>
                {hasRemise && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Remise</span><span>− {eur(devis.totalRemise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>TVA</span><span>{eur(devis.totalTva)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-base" style={{ color: primaryColor }}>
                  <span>Total TTC</span><span>{eur(devis.totalTTC)}</span>
                </div>
                {devis.acompte > 0 && (
                  <div className="flex justify-between text-slate-500 text-xs border-t border-slate-200 pt-2">
                    <span>Acompte</span><span>{eur(acompteMontant)}</span>
                  </div>
                )}
                {devis.acompte > 0 && (
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Net à payer</span><span>{eur(netAPayer)}</span>
                  </div>
                )}
              </div>

              {(devis.conditionsPaiement) && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                  <p className="font-semibold text-slate-700 mb-1">Conditions de paiement</p>
                  <p className="whitespace-pre-line">{devis.conditionsPaiement}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 space-y-0.5">
                {devis.dateEmission && <p>Émis le {fmtDate(devis.dateEmission)}</p>}
                {devis.dateValidite && <p>Valable jusqu&apos;au {fmtDate(devis.dateValidite)}</p>}
              </div>
            </div>
          )}

          {/* ── STEP 2 : TERMS ─────────────────────────────────────── */}
          {step === "terms" && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Avant de signer, veuillez confirmer avoir pris connaissance des éléments suivants.
              </p>

              {devis.mentionsLegales && (
                <div className="bg-slate-50 rounded-xl p-4 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Mentions légales</p>
                  <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{devis.mentionsLegales}</p>
                </div>
              )}

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  term1 ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
                }`}>
                  <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    term1 ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {term1 && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white stroke-white" strokeWidth={3} />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={term1} onChange={(e) => setTerm1(e.target.checked)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">J&apos;ai lu et j&apos;accepte les conditions</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      J&apos;ai pris connaissance du devis {devis.numero} dans son intégralité, incluant les prestations, tarifs, délais et conditions de paiement.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  term2 ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
                }`}>
                  <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    term2 ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {term2 && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white stroke-white" strokeWidth={3} />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={term2} onChange={(e) => setTerm2(e.target.checked)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Je reconnais que cette signature a valeur d&apos;engagement</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Conformément à l&apos;article 1367 du Code civil, ma signature électronique a la même valeur juridique qu&apos;une signature manuscrite et m&apos;engage contractuellement.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Votre signature est horodatée et votre adresse IP est enregistrée à des fins de preuve.</p>
              </div>
            </div>
          )}

          {/* ── STEP 3 : SIGNATURE ─────────────────────────────────── */}
          {step === "sign" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Nom du signataire <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Prénom Nom"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white"
                  style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Votre signature <span className="text-red-400">*</span>
                </label>
                <SignaturePad
                  primaryColor={primaryColor}
                  onConfirm={(b64) => {
                    setSignatureB64(b64)
                    setStep("confirm")
                  }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 4 : CONFIRM ───────────────────────────────────── */}
          {step === "confirm" && signatureB64 && (
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Signataire</span>
                  <span className="font-semibold text-slate-900">{nom || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Devis</span>
                  <span className="font-semibold text-slate-900">{devis.numero}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Montant TTC</span>
                  <span className="font-bold" style={{ color: primaryColor }}>{eur(devis.totalTTC)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-900">{fmtDate(new Date())}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Aperçu de votre signature</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureB64}
                    alt="Aperçu signature"
                    className="w-full max-h-24 object-contain"
                    style={{ imageRendering: "crisp-edges" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setSignatureB64(null); setStep("sign") }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-1.5"
                >
                  ← Recommencer la signature
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>En cliquant sur &quot;Confirmer et signer&quot;, vous acceptez définitivement ce devis. Cette action est irréversible.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="h-px bg-slate-100 flex-shrink-0" />
        <div className="px-5 py-4 flex-shrink-0 flex items-center gap-3">
          {step !== "recap" && (
            <button
              type="button"
              onClick={() => {
                const prev: Record<Step, Step> = { recap: "recap", terms: "recap", sign: "terms", confirm: "sign" }
                setStep(prev[step])
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
          )}

          {step === "recap" && (
            <button
              onClick={() => setStep("terms")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === "terms" && (
            <button
              onClick={() => setStep("sign")}
              disabled={!term1 || !term2}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              <FileText className="w-4 h-4" />
              Passer à la signature
            </button>
          )}

          {step === "sign" && (
            <p className="flex-1 text-xs text-slate-400 text-center">
              Dessinez votre signature puis cliquez sur &quot;Valider&quot;
            </p>
          )}

          {step === "confirm" && (
            <button
              onClick={handleConfirmSign}
              disabled={loading || !signatureB64}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: loading ? undefined : "#059669", boxShadow: loading ? "none" : "0 4px 14px rgba(5,150,105,0.35)" }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                : <><CheckCircle2 className="w-4 h-4" /> Confirmer et signer le devis</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
