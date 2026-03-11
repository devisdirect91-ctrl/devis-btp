import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { factureSchema } from "@/lib/validations/facture"
import { computeLigne, computeDevisTotaux } from "@/lib/devis-utils"
import type { Prisma } from "@prisma/client"

function parseFactureNumero(numero: string): { year: number; seq: number } | null {
  const m = numero.match(/^FAC-(\d{4})-(\d+)$/)
  if (!m) return null
  return { year: parseInt(m[1]), seq: parseInt(m[2]) }
}

export function formatFactureNumero(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(3, "0")}`
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const ids = searchParams.get("ids") ?? ""

  const where: Prisma.FactureWhereInput = { userId: session.user.id }

  if (ids) {
    where.id = { in: ids.split(",").filter(Boolean) }
  }

  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { client: { nom: { contains: search, mode: "insensitive" } } },
      { client: { prenom: { contains: search, mode: "insensitive" } } },
      { client: { societe: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status) where.status = status as Prisma.EnumFactureStatusFilter

  const factures = await prisma.facture.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ factures })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const result = factureSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", issues: result.error.issues }, { status: 400 })
  }

  const data = result.data
  const parsed = parseFactureNumero(data.numero)
  if (!parsed) {
    return NextResponse.json({ error: "Format de numéro invalide (ex: FAC-2026-001)" }, { status: 400 })
  }

  const existing = await prisma.facture.findFirst({
    where: { userId: session.user.id, numeroAnnee: parsed.year, numeroSequence: parsed.seq },
  })
  if (existing) {
    return NextResponse.json({ error: `Le numéro ${data.numero} existe déjà` }, { status: 409 })
  }

  const editorLignes = data.lignes.map((l) => ({
    id: "",
    ligneType: l.ligneType as "LINE" | "SECTION",
    designation: l.designation,
    description: l.description,
    quantite: l.quantite,
    unite: l.unite,
    prixUnitaireHT: l.prixUnitaireHT,
    remise: l.remise,
    tauxTva: l.tauxTva,
  }))

  const totaux = computeDevisTotaux(editorLignes, 0, "PERCENT", 0, "PERCENT")

  const facture = await prisma.facture.create({
    data: {
      numero: data.numero,
      numeroAnnee: parsed.year,
      numeroSequence: parsed.seq,
      status: "BROUILLON",
      dateEmission: new Date(data.dateEmission),
      dateEcheance: new Date(data.dateEcheance),
      totalHT: totaux.totalHtNet,
      totalTva: totaux.totalTva,
      totalTTC: totaux.totalTTC,
      conditionsPaiement: data.conditionsPaiement || null,
      notes: data.notes || null,
      mentionsLegales: data.mentionsLegales || null,
      userId: session.user.id,
      clientId: data.clientId,
      lignes: {
        create: data.lignes.map((l, idx) => {
          const t = l.ligneType === "LINE"
            ? computeLigne(l.quantite, l.prixUnitaireHT, l.remise, l.tauxTva)
            : { totalHT: 0, totalRemise: 0, totalHtNet: 0, totalTva: 0, totalTTC: 0 }
          return {
            ligneType: l.ligneType,
            ordre: idx,
            designation: l.designation,
            description: l.description || null,
            quantite: l.ligneType === "LINE" ? l.quantite : 0,
            unite: l.unite as any,
            prixUnitaireHT: l.ligneType === "LINE" ? l.prixUnitaireHT : 0,
            remise: l.remise,
            tauxTva: l.tauxTva,
            totalHT: t.totalHT,
            totalRemise: t.totalRemise,
            totalHtNet: t.totalHtNet,
            totalTva: t.totalTva,
            totalTTC: t.totalTTC,
          }
        }),
      },
    },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  })

  return NextResponse.json({ facture }, { status: 201 })
}
