import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let body: { ids?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const ids = body.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "IDs requis" }, { status: 400 })
  }

  const { count } = await prisma.devis.deleteMany({
    where: {
      id: { in: ids as string[] },
      userId: session.user.id, // security: only own devis
    },
  })

  return NextResponse.json({ deleted: count })
}
