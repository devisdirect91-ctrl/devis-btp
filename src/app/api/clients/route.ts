import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const type = searchParams.get("type") || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"))
  const skip = (page - 1) * limit

  const where: Prisma.ClientWhereInput = {
    userId: session.user.id,
    ...(type === "PARTICULIER" || type === "PROFESSIONNEL"
      ? { type }
      : {}),
    ...(search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" } },
            { prenom: { contains: search, mode: "insensitive" } },
            { societe: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { ville: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { _count: { select: { devis: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({
    clients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const result = clientSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { pays, ...rest } = result.data
  const client = await prisma.client.create({
    data: {
      ...rest,
      pays: pays || "France",
      userId: session.user.id,
    },
  })

  return NextResponse.json({ client }, { status: 201 })
}
