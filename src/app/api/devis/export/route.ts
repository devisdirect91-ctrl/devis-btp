import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientDisplayName } from "@/lib/client-utils"
import type { Prisma } from "@prisma/client"

const STATUS_FR: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
}

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ""
  const s = String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ids = searchParams.get("ids") ?? ""

  const where: Prisma.DevisWhereInput = { userId: session.user.id }
  if (ids) where.id = { in: ids.split(",").filter(Boolean) }

  const devis = await prisma.devis.findMany({
    where,
    include: { client: true },
    orderBy: { dateEmission: "desc" },
  })

  const header = ["Numéro", "Titre", "Client", "Date émission", "Date validité", "Total HT", "Total TVA", "Total TTC", "Statut", "Date envoi"]
  const rows = devis.map((d) => [
    d.numero,
    d.titre,
    clientDisplayName(d.client),
    new Date(d.dateEmission).toLocaleDateString("fr-FR"),
    d.dateValidite ? new Date(d.dateValidite).toLocaleDateString("fr-FR") : "",
    d.totalHT.toFixed(2),
    d.totalTva.toFixed(2),
    d.totalTTC.toFixed(2),
    STATUS_FR[d.status] ?? d.status,
    d.dateEnvoi ? new Date(d.dateEnvoi).toLocaleDateString("fr-FR") : "",
  ])

  const csv = [header, ...rows].map((row) => row.map(esc).join(",")).join("\r\n")
  const bom = "\uFEFF" // UTF-8 BOM for Excel compatibility

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="devis-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
