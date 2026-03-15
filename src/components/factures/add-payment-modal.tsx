"use client"

import { useState } from "react"
import { X, CreditCard } from "lucide-react"

interface Props {
  factureId: string
  factureNumero: string
  totalTTC: number
  montantPaye: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (newMontantPaye: number, newStatus: string) => void
}

const MODES_PAIEMENT = [
  { value: "VIREMENT", label: "Virement bancaire" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "ESPECES", label: "Espèces" },
  { value: "CB", label: "Carte bancaire" },
  { value: "AUTRE", label: "Autre" },
]

function fmt(value: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function AddPaymentModal({ factureId, factureNumero, totalTTC, montantPaye, isOpen, onClose, onSuccess }: Props) {
  const [montant, setMontant] = useState("")
  const [modePaiement, setModePaiement] = useState("VIREMENT")
  const [reference, setReference] = useState("")
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const resteAPayer = totalTTC - montantPaye

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const montantNum = parseFloat(montant)
    if (isNaN(montantNum) || montantNum <= 0) {
      setError("Montant invalide")
      return
    }
    if (montantNum > resteAPayer + 0.001) {
      setError(`Le montant ne peut pas dépasser ${fmt(resteAPayer)} €`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/factures/${factureId}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: montantNum, modePaiement, reference, datePaiement }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'enregistrement")
      }
      const data = await res.json()
      onSuccess(Math.round((montantPaye + montantNum) * 100) / 100, data.status)
      onClose()
      setMontant("")
      setReference("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold">Ajouter un paiement</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-500">Facture {factureNumero}</p>
              <div className="flex justify-between mt-1">
                <span className="text-sm">Reste à payer :</span>
                <span className="font-bold text-lg">{fmt(resteAPayer)} €</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant reçu</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-12 px-4 pr-10 border rounded-xl text-lg"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMontant(resteAPayer.toFixed(2))}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium whitespace-nowrap"
                >
                  Tout payer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full h-12 px-4 border rounded-xl"
              >
                {MODES_PAIEMENT.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du paiement</label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full h-12 px-4 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence (optionnel)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° de chèque, référence virement…"
                className="w-full h-12 px-4 border rounded-xl"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-xl font-medium">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
