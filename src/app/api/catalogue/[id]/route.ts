import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { catalogueSchema } from "@/lib/validations/catalogue"

async function getOwnedItem(id: string, userId: string) {
  return prisma.catalogItem.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const item = await getOwnedItem(id, session.user.id)
  if (!item) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 })

  return NextResponse.json({ item })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedItem(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 })

  const body = await req.json()

  // Partial update (e.g. toggle actif only)
  if (Object.keys(body).length === 1 && "actif" in body) {
    const item = await prisma.catalogItem.update({ where: { id }, data: { actif: body.actif } })
    return NextResponse.json({ item })
  }

  const result = catalogueSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", issues: result.error.issues }, { status: 400 })
  }

  const item = await prisma.catalogItem.update({ where: { id }, data: result.data })
  return NextResponse.json({ item })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedItem(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 })

  await prisma.catalogItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
