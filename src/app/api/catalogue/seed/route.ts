import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SEED_CATALOG } from "@/lib/catalogue-utils"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = session.user.id

    const existing = await prisma.catalogItem.count({ where: { userId } })
    if (existing > 0) {
      return NextResponse.json(
        { error: "Votre catalogue contient déjà des prestations." },
        { status: 409 }
      )
    }

    const result = await prisma.catalogItem.createMany({
      data: SEED_CATALOG.map((item) => ({
        reference: item.reference,
        designation: item.designation,
        description: item.description,
        prixHT: item.prixHT,
        tauxTva: item.tauxTva,
        actif: true,
        unite: item.unite as any,
        category: item.category as any,
        userId,
      })),
    })

    return NextResponse.json({ created: result.count }, { status: 201 })
  } catch (err) {
    console.error("[seed] error:", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
