import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; acompteId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id: factureId, acompteId } = await params

  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: session.user.id },
    include: { acomptes: { select: { id: true, montant: true } } },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const acompte = facture.acomptes.find((a) => a.id === acompteId)
  if (!acompte) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })

  const remainingTotal = facture.acomptes
    .filter((a) => a.id !== acompteId)
    .reduce((s, a) => s + a.montant, 0)

  const newStatus =
    remainingTotal <= 0 ? "EN_ATTENTE"
    : remainingTotal >= facture.totalTTC - 0.01 ? "PAYEE"
    : "PARTIELLEMENT_PAYEE"

  await prisma.$transaction([
    prisma.acompte.delete({ where: { id: acompteId } }),
    prisma.facture.update({
      where: { id: factureId },
      data: {
        montantPaye: Math.round(remainingTotal * 100) / 100,
        status: newStatus,
        ...(newStatus !== "PAYEE" ? { datePaiement: null } : {}),
      },
    }),
  ])

  return NextResponse.json({ success: true, status: newStatus })
}
