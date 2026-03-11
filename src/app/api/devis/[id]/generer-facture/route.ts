import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function formatFactureNumero(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(3, "0")}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  // 1. Récupère le devis avec ses lignes
  const devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      facture: { select: { id: true, numero: true } },
    },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  // 2. Vérifie que le devis est accepté/signé
  if (devis.status !== "ACCEPTE") {
    return NextResponse.json(
      { error: "Seul un devis accepté peut être transformé en facture" },
      { status: 422 }
    )
  }

  // 3. Vérifie qu'une facture n'existe pas déjà
  if (devis.facture) {
    return NextResponse.json(
      { error: "Une facture existe déjà pour ce devis", factureId: devis.facture.id },
      { status: 409 }
    )
  }

  // 4. Options depuis le body
  const body = await req.json().catch(() => ({}))
  const {
    dateEmission: dateEmissionStr,
    dateEcheance: dateEcheanceStr,
    acompteVerse = 0,
    modePaiementAcompte,
    notes,
  } = body

  const dateEmission = dateEmissionStr ? new Date(dateEmissionStr) : new Date()
  const dateEcheance = dateEcheanceStr
    ? new Date(dateEcheanceStr)
    : (() => { const d = new Date(dateEmission); d.setDate(d.getDate() + 30); return d })()

  // 5. Numérotation automatique
  const year = dateEmission.getFullYear()
  const last = await prisma.facture.findFirst({
    where: { userId: session.user.id, numeroAnnee: year },
    orderBy: { numeroSequence: "desc" },
    select: { numeroSequence: true },
  })
  const seq = (last?.numeroSequence ?? 0) + 1
  const numero = formatFactureNumero(year, seq)

  // 6. Crée la facture + lignes + acompte éventuel en transaction
  const facture = await prisma.$transaction(async (tx) => {
    const created = await tx.facture.create({
      data: {
        numero,
        numeroAnnee: year,
        numeroSequence: seq,
        userId: session.user.id,
        clientId: devis.clientId,
        devisId: devis.id,
        dateEmission,
        dateEcheance,
        totalHT: devis.totalHT,
        totalTva: devis.totalTva,
        totalTTC: devis.totalTTC,
        montantPaye: acompteVerse > 0 ? acompteVerse : 0,
        status: acompteVerse > 0
          ? acompteVerse >= devis.totalTTC ? "PAYEE" : "PARTIELLEMENT_PAYEE"
          : "EN_ATTENTE",
        conditionsPaiement: devis.conditionsPaiement,
        mentionsLegales: devis.mentionsLegales,
        notes: notes || devis.notes || null,
        lignes: {
          create: devis.lignes.map((l) => ({
            ordre: l.ordre,
            ligneType: l.ligneType,
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
          })),
        },
        ...(acompteVerse > 0 && modePaiementAcompte ? {
          acomptes: {
            create: [{
              montant: acompteVerse,
              datePaiement: dateEmission,
              modePaiement: modePaiementAcompte,
              notes: "Acompte issu du devis",
            }],
          },
        } : {}),
      },
    })

    // 7. Marque le devis comme facturé
    await tx.devis.update({
      where: { id: devis.id },
      data: { factureGeneree: true },
    })

    return created
  })

  return NextResponse.json({ facture }, { status: 201 })
}
