"use client"

import { useState } from "react"
import { X, CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react"

const MODES_PAIEMENT = [
  "Virement bancaire",
  "Chèque",
  "Carte bancaire",
  "Espèces",
  "Autre",
]

interface RegisterPaymentModalProps {
  factureId: string
  factureNumero: string
  clientNom: string
  totalTTC: number
  montantPaye: number
  clientEmail?: string | null
  onClose: () => void
  onSaved: () => void
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

export function RegisterPaymentModal({
  factureId,
  factureNumero,
  clientNom,
  totalTTC,
  montantPaye,
  clientEmail,
  onClose,
  onSaved,
}: RegisterPaymentModalProps) {
  const resteAPayer = Math.round((totalTTC - montantPaye) * 100) / 100
  const today = new Date().toISOString().slice(0, 10)

  const [montant, setMontant] = useState(String(resteAPayer))
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState("Virement bancaire")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [envoyerRecu, setEnvoyerRecu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const montantNum = parseFloat(montant) || 0
  const isPaiementPartiel = montantNum > 0 && montantNum < resteAPayer - 0.01
  const isPaiementComplet = montantNum >= resteAPayer - 0.01
  const canShowRecuOption = isPaiementComplet && !!clientEmail

  const validate = (): string | null => {
    if (!montant || montantNum <= 0) return "Le montant doit être supérieur à 0"
    if (montantNum > resteAPayer) return `Le montant ne peut pas dépasser ${eur(resteAPayer)}`
    if (!date) return "La date est requise"
    if (!mode) return "Le mode de paiement est requis"
    return null
  }

  const submit = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/factures/${factureId}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: montantNum,
          datePaiement: date,
          modePaiement: mode,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          envoyerRecu: canShowRecuOption && envoyerRecu,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement")
        setLoading(false)
        return
      }
      onSaved()
    } catch {
      setError("Erreur réseau")
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Enregistrer un paiement</h2>
            <p className="text-xs text-slate-400 mt-0.5">{factureNumero} · {clientNom}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Récap */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total facture</span>
              <span className="font-medium text-slate-700">{eur(totalTTC)}</span>
            </div>
            {montantPaye > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Déjà encaissé</span>
                <span className="text-emerald-600 font-medium">{eur(montantPaye)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-700 font-semibold">Reste à percevoir</span>
              <span className="font-bold text-slate-900">{eur(resteAPayer)}</span>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Badge paiement partiel */}
          {isPaiementPartiel && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Paiement partiel — un solde de {eur(resteAPayer - montantNum)} restera à percevoir
            </div>
          )}

          {/* Montant + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Montant (€)</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > resteAPayer) {
                    setMontant(String(resteAPayer))
                  } else {
                    setMontant(e.target.value)
                  }
                }}
                min={0.01}
                max={resteAPayer}
                step={0.01}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Date de paiement</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Mode + Référence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Mode de paiement</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
              >
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Référence</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° chèque, réf virement…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, informations complémentaires…"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
            />
          </div>

          {/* Option reçu email */}
          {canShowRecuOption && (
            <label className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer group">
              <input
                type="checkbox"
                checked={envoyerRecu}
                onChange={(e) => setEnvoyerRecu(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <div className="flex items-center gap-2 flex-1">
                <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Envoyer un reçu par email</p>
                  <p className="text-xs text-emerald-600">Confirmation envoyée à {clientEmail}</p>
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </>
  )
}
