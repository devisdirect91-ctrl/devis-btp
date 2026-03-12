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
  const userId = session.user.id

  const { id } = await params

  // 1. Récupère le devis avec ses lignes
  const devis = await prisma.devis.findFirst({
    where: { id, userId: userId },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      facture: { select: { id: true, numero: true } },
    },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  const safeDevis = devis

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

  // 5. Numérotation automatique + création en transaction avec retry sur conflit
  const year = dateEmission.getFullYear()

  async function tryCreate(attempt = 0): Promise<{ id: string; numero: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Lecture de la séquence dans la transaction pour éviter les races
        const last = await tx.facture.findFirst({
          where: { userId: userId, numeroAnnee: year },
          orderBy: { numeroSequence: "desc" },
          select: { numeroSequence: true },
        })
        const seq = (last?.numeroSequence ?? 0) + 1
        const numero = formatFactureNumero(year, seq)

        const created = await tx.facture.create({
          data: {
            numero,
            numeroAnnee: year,
            numeroSequence: seq,
            userId: userId,
            clientId: safeDevis.clientId,
            devisId: safeDevis.id,
            dateEmission,
            dateEcheance,
            totalHT: safeDevis.totalHT,
            totalTva: safeDevis.totalTva,
            totalTTC: safeDevis.totalTTC,
            montantPaye: acompteVerse > 0 ? acompteVerse : 0,
            status: acompteVerse > 0
              ? acompteVerse >= safeDevis.totalTTC ? "PAYEE" : "PARTIELLEMENT_PAYEE"
              : "EN_ATTENTE",
            conditionsPaiement: safeDevis.conditionsPaiement,
            mentionsLegales: safeDevis.mentionsLegales,
            notes: notes || safeDevis.notes || null,
            lignes: {
              create: safeDevis.lignes.map((l) => ({
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
          where: { id: safeDevis.id },
          data: { factureGeneree: true },
        })

        return created
      })
    } catch (err: any) {
      // Conflit de numéro (race condition) → réessaie jusqu'à 3 fois
      if (err?.code === "P2002" && attempt < 2) {
        return tryCreate(attempt + 1)
      }
      throw err
    }
  }

  const facture = await tryCreate()

  return NextResponse.json({ facture }, { status: 201 })
}
