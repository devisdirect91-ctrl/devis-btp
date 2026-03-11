"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, CheckCircle2, Plus, Trash2, Loader2 } from "lucide-react"
import { RegisterPaymentModal } from "./RegisterPaymentModal"

interface AcompteData {
  id: string
  montant: number
  datePaiement: string // ISO string
  modePaiement: string
  reference: string | null
  notes: string | null
}

interface PaiementsSectionProps {
  factureId: string
  factureNumero: string
  clientNom: string
  totalTTC: number
  montantPaye: number
  clientEmail?: string | null
  status: string
  acomptes: AcompteData[]
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function PaiementsSection({
  factureId,
  factureNumero,
  clientNom,
  totalTTC,
  montantPaye,
  clientEmail,
  status,
  acomptes,
}: PaiementsSectionProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canPay = status !== "PAYEE" && status !== "ANNULEE"
  const isPaid = status === "PAYEE"
  const resteAPayer = Math.max(0, totalTTC - montantPaye)

  const handleDelete = async (acompteId: string) => {
    if (!confirm("Supprimer ce paiement ?")) return
    setDeletingId(acompteId)
    try {
      await fetch(`/api/factures/${factureId}/acomptes/${acompteId}`, {
        method: "DELETE",
      })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {showModal && (
        <RegisterPaymentModal
          factureId={factureId}
          factureNumero={factureNumero}
          clientNom={clientNom}
          totalTTC={totalTTC}
          montantPaye={montantPaye}
          clientEmail={clientEmail}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh() }}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            Paiements reçus
          </h2>
          {canPay && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Enregistrer un paiement
            </button>
          )}
        </div>

        {/* Liste des paiements */}
        {acomptes.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {acomptes.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{eur(a.montant)}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                        {a.modePaiement}
                      </span>
                      {a.reference && (
                        <span className="text-xs text-slate-400">· {a.reference}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(a.datePaiement)}</p>
                    {a.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">{a.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                  title="Supprimer ce paiement"
                >
                  {deletingId === a.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Récapitulatif */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2 text-sm bg-slate-50/50">
          <div className="flex justify-between text-slate-600">
            <span>Total TTC</span>
            <span className="font-medium">{eur(totalTTC)}</span>
          </div>
          {montantPaye > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Encaissé</span>
              <span className="font-medium">{eur(montantPaye)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold text-base border-t border-slate-200 pt-2 ${
            isPaid ? "text-emerald-600" : "text-slate-900"
          }`}>
            <span>{isPaid ? "Soldée ✓" : "Reste à percevoir"}</span>
            <span>{eur(resteAPayer)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
