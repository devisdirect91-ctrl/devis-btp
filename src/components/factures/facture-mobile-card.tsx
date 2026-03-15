"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard } from "lucide-react"
import { AddPaymentModal } from "./add-payment-modal"
import { computeFactureStatus } from "@/lib/facture-utils"
import { clientDisplayName } from "@/lib/client-utils"

interface FactureMobileCardProps {
  facture: {
    id: string
    numero: string
    status: string
    totalTTC: number
    montantPaye: number
    dateEcheance: Date | string
    datePaiement?: Date | string | null
    client: {
      nom: string
      prenom?: string | null
      societe?: string | null
      type: string
    }
  }
}

const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  EN_ATTENTE:          { dot: "bg-yellow-400", text: "text-yellow-600", label: "En attente" },
  PARTIELLEMENT_PAYEE: { dot: "bg-blue-400",   text: "text-blue-600",   label: "Partiel"    },
  PAYEE:               { dot: "bg-green-500",  text: "text-green-600",  label: "Payée"      },
  EN_RETARD:           { dot: "bg-red-500",    text: "text-red-600",    label: "En retard"  },
  BROUILLON:           { dot: "bg-gray-300",   text: "text-gray-500",   label: "Brouillon"  },
  ANNULEE:             { dot: "bg-gray-300",   text: "text-gray-400",   label: "Annulée"    },
}

function fmtMontant(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function FactureMobileCard({ facture: init }: FactureMobileCardProps) {
  const [montantPaye, setMontantPaye] = useState(init.montantPaye)
  const [status, setStatus] = useState(init.status)
  const [showModal, setShowModal] = useState(false)

  const displayStatus = computeFactureStatus(status, new Date(init.dateEcheance))
  const s = STATUS_STYLE[displayStatus] ?? STATUS_STYLE.EN_ATTENTE

  const isRetard  = displayStatus === "EN_RETARD"
  const isPartiel = displayStatus === "PARTIELLEMENT_PAYEE"
  const isPayee   = displayStatus === "PAYEE"
  const isAnnulee = status === "ANNULEE"
  const canPay    = !isPayee && !isAnnulee

  const jours = isRetard
    ? Math.floor((Date.now() - new Date(init.dateEcheance).getTime()) / 86400000)
    : 0

  const clientName = clientDisplayName(init.client as Parameters<typeof clientDisplayName>[0])

  function handlePaymentSuccess(newMontantPaye: number, newStatus: string) {
    setMontantPaye(newMontantPaye)
    setStatus(newStatus)
  }

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <Link href={`/factures/${init.id}`} className="block p-4 active:bg-gray-50 transition-colors">
          {/* Ligne 1 : Client + Statut */}
          <div className="flex justify-between items-start gap-2">
            <p className="font-semibold text-gray-900 text-sm">{clientName}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
            </div>
          </div>

          {/* Ligne 2 : Numéro + date/retard + montant */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="font-mono">{init.numero}</span>
              <span>·</span>
              {isRetard ? (
                <span className="text-red-600 font-semibold">+{jours}j</span>
              ) : isPayee ? (
                <span>Payée le {fmtDate(init.datePaiement)}</span>
              ) : (
                <span>Éch. {fmtDate(init.dateEcheance)}</span>
              )}
            </div>
            {isPartiel ? (
              <p className="text-sm">
                <span className="font-bold text-blue-600">{fmtMontant(montantPaye)}</span>
                <span className="text-gray-400 font-normal text-xs"> / {fmtMontant(init.totalTTC)}</span>
              </p>
            ) : (
              <p className="font-bold text-sm text-gray-900">{fmtMontant(init.totalTTC)}</p>
            )}
          </div>
        </Link>

        {/* Boutons d'action */}
        {(canPay || isRetard || displayStatus === "EN_ATTENTE") && (
          <div className="px-4 pb-3 flex gap-2">
            {canPay && (
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-600 active:bg-green-100 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Paiement
              </button>
            )}
            {(isRetard || displayStatus === "EN_ATTENTE") && (
              <Link
                href={`/factures/${init.id}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isRetard
                    ? "bg-red-50 text-red-600 active:bg-red-100"
                    : "bg-gray-50 text-gray-600 active:bg-gray-100"
                }`}
              >
                <span>📧</span>
                {isRetard ? "Relancer le client" : "Envoyer un rappel"}
              </Link>
            )}
          </div>
        )}
      </div>

      <AddPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        factureId={init.id}
        factureNumero={init.numero}
        totalTTC={init.totalTTC}
        montantPaye={montantPaye}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
