import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { catalogueSchema } from "@/lib/validations/catalogue"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const actif = searchParams.get("actif")

  const where: Prisma.CatalogItemWhereInput = {
    userId: session.user.id,
    ...(category ? { category: category as any } : {}),
    ...(actif !== null && actif !== "" ? { actif: actif === "true" } : {}),
    ...(search
      ? {
          OR: [
            { designation: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const items = await prisma.catalogItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { designation: "asc" }],
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const result = catalogueSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", issues: result.error.issues }, { status: 400 })
  }

  const item = await prisma.catalogItem.create({
    data: { ...result.data, userId: session.user.id },
  })

  return NextResponse.json({ item }, { status: 201 })
}
