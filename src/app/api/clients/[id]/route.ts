import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"

async function getOwnedClient(id: string, userId: string) {
  return prisma.client.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const client = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: {
      devis: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          numero: true,
          titre: true,
          status: true,
          dateEmission: true,
          dateValidite: true,
          totalHT: true,
          totalTTC: true,
        },
      },
      _count: { select: { devis: true } },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  return NextResponse.json({ client })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedClient(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  const body = await req.json()
  const result = clientSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: result.error.issues },
      { status: 400 }
    )
  }

  const client = await prisma.client.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json({ client })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedClient(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  const devisCount = await prisma.devis.count({ where: { clientId: id } })
  if (devisCount > 0) {
    return NextResponse.json(
      {
        error: `Ce client possède ${devisCount} devis. Supprimez d'abord les devis associés.`,
      },
      { status: 409 }
    )
  }

  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
