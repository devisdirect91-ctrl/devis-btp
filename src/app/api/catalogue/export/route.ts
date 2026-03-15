import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const items = await prisma.catalogItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { designation: "asc" }],
  })

  const headers = ["reference", "categorie", "designation", "description", "unite", "prixHT", "tauxTva"]
  const rows = items.map((item) => [
    escapeCsv(item.reference),
    escapeCsv(item.category),
    escapeCsv(item.designation),
    escapeCsv(item.description),
    escapeCsv(item.unite),
    escapeCsv(item.prixHT),
    escapeCsv(item.tauxTva),
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="catalogue-${date}.csv"`,
    },
  })
}
