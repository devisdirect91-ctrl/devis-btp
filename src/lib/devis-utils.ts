export function formatNumero(year: number, seq: number): string {
  return `DEVIS-${year}-${String(seq).padStart(3, "0")}`
}

export function parseNumero(numero: string): { year: number; seq: number } | null {
  const m = numero.match(/^DEVIS-(\d{4})-(\d+)$/)
  if (!m) return null
  return { year: parseInt(m[1]), seq: parseInt(m[2]) }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface LigneTotals {
  totalHT: number
  totalRemise: number
  totalHtNet: number
  totalTva: number
  totalTTC: number
}

export function computeLigne(
  quantite: number,
  prixUnitaireHT: number,
  remise: number,
  tauxTva: number
): LigneTotals {
  const totalHT = round2(quantite * prixUnitaireHT)
  const totalRemise = round2(totalHT * (remise / 100))
  const totalHtNet = round2(totalHT - totalRemise)
  const totalTva = round2(totalHtNet * (tauxTva / 100))
  const totalTTC = round2(totalHtNet + totalTva)
  return { totalHT, totalRemise, totalHtNet, totalTva, totalTTC }
}

export interface TvaDetail {
  taux: number
  base: number
  montant: number
}

export interface DevisTotaux {
  totalHtBrut: number
  totalRemiseLignes: number
  totalHT: number
  totalRemiseGlobale: number
  totalHtNet: number
  tvaDetails: TvaDetail[]
  totalTva: number
  totalTTC: number
  acompteMontant: number
  netAPayer: number
}

export interface EditorLigne {
  id: string
  ligneType: "LINE" | "SECTION"
  designation: string
  description?: string
  quantite: number
  unite: string
  prixUnitaireHT: number
  remise: number
  tauxTva: number
  catalogItemId?: string | null
}

export function computeDevisTotaux(
  lignes: EditorLigne[],
  remiseGlobale: number,
  remiseGlobaleType: "PERCENT" | "AMOUNT",
  acompte: number,
  acompteType: "PERCENT" | "AMOUNT"
): DevisTotaux {
  const realLines = lignes.filter((l) => l.ligneType === "LINE")

  const totalHtBrut = round2(
    realLines.reduce((s, l) => s + l.quantite * l.prixUnitaireHT, 0)
  )
  const totalRemiseLignes = round2(
    realLines.reduce((s, l) => s + round2(l.quantite * l.prixUnitaireHT) * (l.remise / 100), 0)
  )
  const totalHT = round2(totalHtBrut - totalRemiseLignes)

  const totalRemiseGlobale =
    remiseGlobaleType === "PERCENT"
      ? round2(totalHT * (remiseGlobale / 100))
      : round2(Math.min(remiseGlobale, totalHT))

  const totalHtNet = round2(totalHT - totalRemiseGlobale)
  const remiseRatio = totalHT > 0 ? totalHtNet / totalHT : 1

  // TVA grouped by rate, global remise applied proportionally
  const tvaMap = new Map<number, { base: number; montant: number }>()
  for (const l of realLines) {
    const ht = round2(l.quantite * l.prixUnitaireHT)
    const htAfterLineRemise = round2(ht - ht * (l.remise / 100))
    const htFinal = round2(htAfterLineRemise * remiseRatio)
    const tva = round2(htFinal * (l.tauxTva / 100))
    const existing = tvaMap.get(l.tauxTva) ?? { base: 0, montant: 0 }
    tvaMap.set(l.tauxTva, { base: round2(existing.base + htFinal), montant: round2(existing.montant + tva) })
  }

  const tvaDetails: TvaDetail[] = Array.from(tvaMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([taux, { base, montant }]) => ({ taux, base, montant }))

  const totalTva = round2(tvaDetails.reduce((s, t) => s + t.montant, 0))
  const totalTTC = round2(totalHtNet + totalTva)

  const acompteMontant =
    acompteType === "PERCENT"
      ? round2(totalTTC * (acompte / 100))
      : round2(Math.min(acompte, totalTTC))

  const netAPayer = round2(totalTTC - acompteMontant)

  return {
    totalHtBrut,
    totalRemiseLignes,
    totalHT,
    totalRemiseGlobale,
    totalHtNet,
    tvaDetails,
    totalTva,
    totalTTC,
    acompteMontant,
    netAPayer,
  }
}

export function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

export function newLigne(tauxTvaDefaut = 20): EditorLigne {
  return {
    id: Math.random().toString(36).slice(2),
    ligneType: "LINE",
    designation: "",
    description: "",
    quantite: 1,
    unite: "UNITE",
    prixUnitaireHT: 0,
    remise: 0,
    tauxTva: tauxTvaDefaut,
  }
}

export function newSection(): EditorLigne {
  return {
    id: Math.random().toString(36).slice(2),
    ligneType: "SECTION",
    designation: "",
    description: "",
    quantite: 0,
    unite: "UNITE",
    prixUnitaireHT: 0,
    remise: 0,
    tauxTva: 0,
  }
}

export const UNITE_LABELS: Record<string, string> = {
  UNITE: "u",
  HEURE: "h",
  JOUR: "j",
  METRE: "m",
  METRE_CARRE: "m²",
  METRE_CUBE: "m³",
  METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait",
  ENSEMBLE: "Ens.",
  KILOGRAMME: "kg",
  TONNE: "t",
  LITRE: "L",
}

export const TVA_TAUX = [20, 10, 5.5, 0]
