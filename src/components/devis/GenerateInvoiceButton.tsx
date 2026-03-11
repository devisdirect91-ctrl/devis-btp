"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, AlertCircle, X, Receipt } from "lucide-react"

interface Props {
  devisId: string
  totalTTC: number
  acompteDevis: number
  acompteTypeDevis: string
}

const MODES_PAIEMENT = ["Virement", "Chèque", "CB", "Espèces", "Autre"]

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function GenerateInvoiceButton({ devisId, totalTTC, acompteDevis, acompteTypeDevis }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const today = new Date()
  const acompteMontant = acompteTypeDevis === "PERCENT"
    ? Math.round(totalTTC * acompteDevis / 100 * 100) / 100
    : Math.min(acompteDevis, totalTTC)

  const [dateEmission, setDateEmission] = useState(toInputDate(today))
  const [dateEcheance, setDateEcheance] = useState(toInputDate(addDays(today, 30)))
  const [hasAcompte, setHasAcompte] = useState(acompteMontant > 0)
  const [acompteVerse, setAcompteVerse] = useState(acompteMontant > 0 ? String(acompteMontant) : "")
  const [modePaiementAcompte, setModePaiementAcompte] = useState("Virement")
  const [notes, setNotes] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    const acompteNum = hasAcompte ? parseFloat(acompteVerse) || 0 : 0

    try {
      const res = await fetch(`/api/devis/${devisId}/generer-facture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateEmission,
          dateEcheance,
          acompteVerse: acompteNum,
          modePaiementAcompte: acompteNum > 0 ? modePaiementAcompte : undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue")
        setLoading(false)
        return
      }
      router.push(`/factures/${data.facture.id}`)
    } catch {
      setError("Erreur réseau. Réessayez.")
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
      >
        <Receipt className="w-4 h-4" />
        Générer la facture
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Générer la facture</h2>
                  <p className="text-xs text-slate-500">À partir du devis accepté</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Date d&apos;émission
                  </label>
                  <input
                    type="date"
                    value={dateEmission}
                    onChange={(e) => {
                      setDateEmission(e.target.value)
                      // Recalcule l'échéance si elle était à J+30
                      const newEch = addDays(new Date(e.target.value), 30)
                      setDateEcheance(toInputDate(newEch))
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    min={dateEmission}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Montant total rappel */}
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="text-slate-500">Total TTC de la facture</span>
                <span className="font-bold text-slate-900">
                  {totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>

              {/* Acompte */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasAcompte}
                    onChange={(e) => setHasAcompte(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Enregistrer un acompte déjà versé
                  </span>
                </label>

                {hasAcompte && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Montant (€)
                      </label>
                      <input
                        type="number"
                        value={acompteVerse}
                        onChange={(e) => setAcompteVerse(e.target.value)}
                        min={0}
                        max={totalTTC}
                        step={0.01}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Mode de paiement
                      </label>
                      <select
                        value={modePaiementAcompte}
                        onChange={(e) => setModePaiementAcompte(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
                      >
                        {MODES_PAIEMENT.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Notes additionnelles <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires pour cette facture…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                Créer la facture
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
