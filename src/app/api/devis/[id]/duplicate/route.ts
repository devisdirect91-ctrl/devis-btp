import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatNumero } from "@/lib/devis-utils"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const source = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  })
  if (!source) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  const year = new Date().getFullYear()
  const last = await prisma.devis.findFirst({
    where: { userId: session.user.id, numeroAnnee: year },
    orderBy: { numeroSequence: "desc" },
    select: { numeroSequence: true },
  })
  const seq = (last?.numeroSequence ?? 0) + 1

  const copy = await prisma.devis.create({
    data: {
      numero: formatNumero(year, seq),
      numeroAnnee: year,
      numeroSequence: seq,
      titre: `Copie — ${source.titre}`,
      status: "EN_ATTENTE",
      signatureToken: crypto.randomUUID(),
      validiteJours: source.validiteJours,
      dateEmission: new Date(),
      dateValidite: (() => {
        const d = new Date()
        d.setDate(d.getDate() + source.validiteJours)
        return d
      })(),
      adresseChantier: source.adresseChantier,
      objetTravaux: source.objetTravaux,
      remiseGlobale: source.remiseGlobale,
      remiseGlobaleType: source.remiseGlobaleType,
      acompte: source.acompte,
      acompteType: source.acompteType,
      conditionsPaiement: source.conditionsPaiement,
      delaiExecution: source.delaiExecution,
      notes: source.notes,
      mentionsLegales: source.mentionsLegales,
      totalHT: source.totalHT,
      totalRemise: source.totalRemise,
      totalTva: source.totalTva,
      totalTTC: source.totalTTC,
      userId: session.user.id,
      clientId: source.clientId,
      lignes: {
        create: source.lignes.map((l) => ({
          ligneType: l.ligneType,
          ordre: l.ordre,
          designation: l.designation,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaireHT: l.prixUnitaireHT,
          remise: l.remise,
          tauxTva: l.tauxTva,
          totalHT: l.totalHT,
          totalRemise: l.totalRemise,
          totalHtNet: l.totalHtNet,
          totalTva: l.totalTva,
          totalTTC: l.totalTTC,
          catalogItemId: l.catalogItemId,
        })),
      },
    },
  })

  return NextResponse.json({ devis: copy }, { status: 201 })
}
