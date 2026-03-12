import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const q = new URL(req.url).searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  const items = await prisma.catalogItem.findMany({
    where: {
      userId: session.user.id,
      actif: true,
      OR: [
        { designation: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { reference: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      category: true,
      designation: true,
      description: true,
      unite: true,
      prixHT: true,
      tauxTva: true,
      reference: true,
    },
    take: 6,
    orderBy: { designation: "asc" },
  })

  return NextResponse.json(items)
}
