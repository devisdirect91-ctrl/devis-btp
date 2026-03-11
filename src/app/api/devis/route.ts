import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { devisSchema } from "@/lib/validations/devis"
import { parseNumero, computeLigne, computeDevisTotaux } from "@/lib/devis-utils"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""
  const montantMin = searchParams.get("montantMin") ?? ""
  const montantMax = searchParams.get("montantMax") ?? ""
  const ids = searchParams.get("ids") ?? "" // comma-separated for export

  const where: Prisma.DevisWhereInput = { userId: session.user.id }

  if (ids) {
    where.id = { in: ids.split(",").filter(Boolean) }
  }

  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { titre: { contains: search, mode: "insensitive" } },
      { client: { nom: { contains: search, mode: "insensitive" } } },
      { client: { prenom: { contains: search, mode: "insensitive" } } },
      { client: { societe: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status) where.status = status as Prisma.EnumDevisStatusFilter

  if (dateDebut || dateFin) {
    where.dateEmission = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
    }
  }

  if (montantMin) where.totalTTC = { gte: parseFloat(montantMin) }
  if (montantMax) {
    const existing = where.totalTTC as Prisma.FloatFilter | undefined
    where.totalTTC = { ...(existing ?? {}), lte: parseFloat(montantMax) }
  }

  const devisList = await prisma.devis.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ devis: devisList })
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

  const result = devisSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", issues: result.error.issues }, { status: 400 })
  }

  const data = result.data
  const parsed = parseNumero(data.numero)
  if (!parsed) {
    return NextResponse.json({ error: "Format de numéro invalide (ex: DEVIS-2024-001)" }, { status: 400 })
  }

  const existing = await prisma.devis.findFirst({
    where: { userId: session.user.id, numeroAnnee: parsed.year, numeroSequence: parsed.seq },
  })
  if (existing) {
    return NextResponse.json({ error: `Le numéro ${data.numero} existe déjà` }, { status: 409 })
  }

  const totaux = computeDevisTotaux(
    data.lignes.map((l) => ({ ...l, id: "", ligneType: l.ligneType as "LINE" | "SECTION" })),
    data.remiseGlobale,
    data.remiseGlobaleType,
    data.acompte,
    data.acompteType
  )

  const dateEmission = new Date(data.dateEmission)
  const dateValidite = new Date(dateEmission)
  dateValidite.setDate(dateValidite.getDate() + data.validiteJours)

  const devis = await prisma.devis.create({
    data: {
      numero: data.numero,
      numeroAnnee: parsed.year,
      numeroSequence: parsed.seq,
      titre: data.titre,
      status: "BROUILLON",
      signatureToken: crypto.randomUUID(),
      validiteJours: data.validiteJours,
      dateEmission,
      dateValidite,
      adresseChantier: data.adresseChantier || null,
      objetTravaux: data.objetTravaux || null,
      dateDebutPrevisionnel: data.dateDebutPrevisionnel ? new Date(data.dateDebutPrevisionnel) : null,
      remiseGlobale: data.remiseGlobale,
      remiseGlobaleType: data.remiseGlobaleType,
      acompte: data.acompte,
      acompteType: data.acompteType,
      conditionsPaiement: data.conditionsPaiement || null,
      delaiExecution: data.delaiExecution || null,
      notes: data.notes || null,
      mentionsLegales: data.mentionsLegales || null,
      totalHT: totaux.totalHtNet,
      totalRemise: totaux.totalRemiseGlobale,
      totalTva: totaux.totalTva,
      totalTTC: totaux.totalTTC,
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
            catalogItemId: l.catalogItemId || null,
          }
        }),
      },
    },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  })

  return NextResponse.json({ devis }, { status: 201 })
}
