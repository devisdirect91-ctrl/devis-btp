import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { devisSchema } from "@/lib/validations/devis"
import { parseNumero, computeLigne, computeDevisTotaux } from "@/lib/devis-utils"

async function getOwned(id: string, userId: string) {
  return prisma.devis.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  return NextResponse.json({ devis })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwned(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  const body = await req.json()

  // Simple status-only update
  if (body.status && Object.keys(body).length === 1) {
    const devis = await prisma.devis.update({ where: { id }, data: { status: body.status } })
    return NextResponse.json({ devis })
  }

  const result = devisSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", issues: result.error.issues }, { status: 400 })
  }

  const data = result.data
  const parsed = parseNumero(data.numero)
  if (!parsed) return NextResponse.json({ error: "Format numéro invalide" }, { status: 400 })

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

  // Replace all lignes
  await prisma.ligneDevis.deleteMany({ where: { devisId: id } })

  const devis = await prisma.devis.update({
    where: { id },
    data: {
      numero: data.numero,
      numeroAnnee: parsed.year,
      numeroSequence: parsed.seq,
      titre: data.titre,
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

  return NextResponse.json({ devis })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwned(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  await prisma.devis.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
