import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_STATUSES = ["EN_ATTENTE", "SIGNE", "REFUSE"] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, status: true },
  })

  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  if (devis.status === "SIGNE_ELECTRONIQUEMENT" || devis.status === "REFUSE_ELECTRONIQUEMENT") {
    return NextResponse.json(
      { error: "Impossible de modifier un devis traité électroniquement" },
      { status: 400 }
    )
  }

  const updated = await prisma.devis.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  })

  return NextResponse.json(updated)
}
