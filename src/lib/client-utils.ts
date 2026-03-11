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
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  VU: "Vu",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
}

export const STATUS_STYLES: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-600 border border-slate-200",
  ENVOYE: "bg-blue-50 text-blue-700 border border-blue-200",
  VU: "bg-purple-50 text-purple-700 border border-purple-200",
  ACCEPTE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REFUSE: "bg-red-50 text-red-700 border border-red-200",
  EXPIRE: "bg-orange-50 text-orange-700 border border-orange-200",
}
