export function clientDisplayName(client: {
  nom: string
  prenom?: string | null
  societe?: string | null
  type: string
}): string {
  if (client.type === "PROFESSIONNEL" && client.societe) return client.societe
  return [client.prenom, client.nom].filter(Boolean).join(" ")
}

export function clientInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return displayName.slice(0, 2).toUpperCase()
}

export const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  SIGNE: "Signé",
  SIGNE_ELECTRONIQUEMENT: "Signé électroniquement",
  REFUSE: "Refusé",
  EXPIRE: "Expiré", // display-only (computed from dateValidite)
}

export const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  SIGNE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SIGNE_ELECTRONIQUEMENT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REFUSE: "bg-red-50 text-red-700 border border-red-200",
  EXPIRE: "bg-orange-50 text-orange-700 border border-orange-200",
}
