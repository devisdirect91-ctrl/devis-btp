import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
    include: { acomptes: { select: { montant: true } } },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  if (facture.status === "PAYEE" || facture.status === "ANNULEE") {
    return NextResponse.json({ error: "Cette facture ne peut plus recevoir de paiement" }, { status: 422 })
  }

  const body = await req.json()
  const { montant, datePaiement, modePaiement, reference, notes } = body

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
  }
  if (!datePaiement) return NextResponse.json({ error: "Date de paiement requise" }, { status: 400 })
  if (!modePaiement) return NextResponse.json({ error: "Mode de paiement requis" }, { status: 400 })

  const totalDejaRecu = facture.acomptes.reduce((s, a) => s + a.montant, 0)
  const nouveauTotal = totalDejaRecu + montant

  const newStatus = nouveauTotal >= facture.totalTTC
    ? "PAYEE"
    : "PARTIELLEMENT_PAYEE"

  const [acompte] = await prisma.$transaction([
    prisma.acompte.create({
      data: {
        factureId: id,
        montant,
        datePaiement: new Date(datePaiement),
        modePaiement,
        reference: reference?.trim() || null,
        notes: notes?.trim() || null,
      },
    }),
    prisma.facture.update({
      where: { id },
      data: {
        montantPaye: nouveauTotal,
        status: newStatus,
        ...(newStatus === "PAYEE" ? {
          datePaiement: new Date(datePaiement),
          modePaiement,
        } : {}),
      },
    }),
  ])

  return NextResponse.json({ acompte, status: newStatus }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id: factureId } = await params
  const body = await req.json()
  const { acompteId } = body

  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: session.user.id },
    include: { acomptes: { select: { id: true, montant: true } } },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const acompte = facture.acomptes.find((a) => a.id === acompteId)
  if (!acompte) return NextResponse.json({ error: "Acompte introuvable" }, { status: 404 })

  const remaining = facture.acomptes
    .filter((a) => a.id !== acompteId)
    .reduce((s, a) => s + a.montant, 0)

  const newStatus = remaining <= 0 ? "EN_ATTENTE"
    : remaining >= facture.totalTTC ? "PAYEE"
    : "PARTIELLEMENT_PAYEE"

  await prisma.$transaction([
    prisma.acompte.delete({ where: { id: acompteId } }),
    prisma.facture.update({
      where: { id: factureId },
      data: {
        montantPaye: remaining,
        status: newStatus,
        ...(newStatus !== "PAYEE" ? { datePaiement: null } : {}),
      },
    }),
  ])

  return NextResponse.json({ success: true, status: newStatus })
}
