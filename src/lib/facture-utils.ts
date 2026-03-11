export const FACTURE_STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  PARTIELLEMENT_PAYEE: "Part. payée",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
}

export const FACTURE_STATUS_STYLES: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-600 border border-slate-200",
  EN_ATTENTE: "bg-amber-50 text-amber-700 border border-amber-200",
  PARTIELLEMENT_PAYEE: "bg-blue-50 text-blue-700 border border-blue-200",
  PAYEE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  EN_RETARD: "bg-red-50 text-red-700 border border-red-200",
  ANNULEE: "bg-slate-100 text-slate-500 border border-slate-200",
}

/** Calcule le statut affiché : EN_RETARD si EN_ATTENTE ou PARTIELLEMENT_PAYEE avec échéance dépassée */
export function computeFactureStatus(status: string, dateEcheance: Date): string {
  if (
    (status === "EN_ATTENTE" || status === "PARTIELLEMENT_PAYEE") &&
    new Date(dateEcheance) < new Date()
  ) {
    return "EN_RETARD"
  }
  return status
}

export function eur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}
