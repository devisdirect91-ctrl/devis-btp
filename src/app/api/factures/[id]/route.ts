import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getOwned(id: string, userId: string) {
  return prisma.facture.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      acomptes: { orderBy: { datePaiement: "asc" } },
      devis: { select: { id: true, numero: true, titre: true } },
    },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  return NextResponse.json({ facture })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwned(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const body = await req.json()
  const { status, modePaiement, datePaiement, notes } = body

  const facture = await prisma.facture.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(modePaiement !== undefined ? { modePaiement } : {}),
      ...(datePaiement !== undefined ? { datePaiement: datePaiement ? new Date(datePaiement) : null } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })
  return NextResponse.json({ facture })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwned(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  if (existing.status === "PAYEE") {
    return NextResponse.json({ error: "Impossible de supprimer une facture payée" }, { status: 422 })
  }

  // Si liée à un devis, remet factureGeneree à false
  if (existing.devisId) {
    await prisma.devis.update({ where: { id: existing.devisId }, data: { factureGeneree: false } })
  }

  await prisma.facture.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
