import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatNumero } from "@/lib/devis-utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const year = new Date().getFullYear()

  const last = await prisma.devis.findFirst({
    where: { userId: session.user.id, numeroAnnee: year },
    orderBy: { numeroSequence: "desc" },
    select: { numeroSequence: true },
  })

  const seq = (last?.numeroSequence ?? 0) + 1
  return NextResponse.json({ numero: formatNumero(year, seq), year, seq })
}
