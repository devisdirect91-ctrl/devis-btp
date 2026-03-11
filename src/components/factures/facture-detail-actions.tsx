"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { RegisterPaymentModal } from "./RegisterPaymentModal"

export function FactureDetailActions({
  factureId,
  factureNumero,
  clientNom,
  status,
  totalTTC,
  montantPaye,
  clientEmail,
}: {
  factureId: string
  factureNumero: string
  clientNom: string
  status: string
  totalTTC: number
  montantPaye: number
  clientEmail?: string | null
}) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const canPay = status !== "PAYEE" && status !== "ANNULEE"

  if (!canPay) return null

  return (
    <>
      <button
        onClick={() => setModal(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        Paiement
      </button>

      {modal && (
        <RegisterPaymentModal
          factureId={factureId}
          factureNumero={factureNumero}
          clientNom={clientNom}
          totalTTC={totalTTC}
          montantPaye={montantPaye}
          clientEmail={clientEmail}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); router.refresh() }}
        />
      )}
    </>
  )
}
