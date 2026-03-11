import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FilePlus } from "lucide-react"
import { DevisFilters } from "@/components/devis/devis-filters"
import { DevisTable } from "@/components/devis/devis-table"
import type { Prisma } from "@prisma/client"

export const metadata = { title: "Mes devis — DevisBTP" }

function getPeriodDates(periode: string): { gte?: Date } {
  const now = new Date()
  switch (periode) {
    case "7d":
      return { gte: new Date(now.getTime() - 7 * 86400_000) }
    case "30d":
      return { gte: new Date(now.getTime() - 30 * 86400_000) }
    case "month":
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3)
      return { gte: new Date(now.getFullYear(), q * 3, 1) }
    }
    case "year":
      return { gte: new Date(now.getFullYear(), 0, 1) }
    default:
      return {}
  }
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex-1 min-w-[140px]">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function DevisPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const sp = await searchParams

  const search = sp.search ?? ""
  const status = sp.status ?? ""
  const periode = sp.periode ?? ""
  const montantMin = sp.montantMin ? parseFloat(sp.montantMin) : undefined
  const montantMax = sp.montantMax ? parseFloat(sp.montantMax) : undefined

  const periodDates = getPeriodDates(periode)

  // Build filter where clause
  const where: Prisma.DevisWhereInput = { userId }

  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { titre: { contains: search, mode: "insensitive" } },
      { client: { nom: { contains: search, mode: "insensitive" } } },
      { client: { prenom: { contains: search, mode: "insensitive" } } },
      { client: { societe: { contains: search, mode: "insensitive" } } },
    ]
  }
  if (status) where.status = status as Prisma.EnumDevisStatusFilter
  if (periodDates.gte) where.dateEmission = periodDates
  if (montantMin !== undefined) where.totalTTC = { gte: montantMin }
  if (montantMax !== undefined) {
    const existing = where.totalTTC as Prisma.FloatFilter | undefined
    where.totalTTC = { ...(existing ?? {}), lte: montantMax }
  }

  // Parallel fetch: filtered list + all for stats
  const [devisList, allStats] = await Promise.all([
    prisma.devis.findMany({
      where,
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, societe: true, type: true, email: true, ville: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.devis.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
      _sum: { totalTTC: true },
    }),
  ])

  // Compute stats
  const byStatus = Object.fromEntries(
    allStats.map((s) => [s.status, { count: s._count.id, total: s._sum.totalTTC ?? 0 }])
  )
  const totalCount = allStats.reduce((s, r) => s + r._count.id, 0)
  const caAccepte = byStatus.ACCEPTE?.total ?? 0
  const caEnAttente = byStatus.ENVOYE?.total ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes devis</h1>
            <p className="text-sm text-slate-500 mt-0.5">{totalCount} devis au total</p>
          </div>
          <Link
            href="/devis/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <FilePlus className="w-4 h-4" />
            Nouveau devis
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StatCard label="Total" value={totalCount} />
          <StatCard
            label="Brouillons"
            value={byStatus.BROUILLON?.count ?? 0}
            accent="text-slate-700"
          />
          <StatCard
            label="En attente"
            value={byStatus.ENVOYE?.count ?? 0}
            sub={caEnAttente > 0 ? caEnAttente.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : undefined}
            accent="text-blue-600"
          />
          <StatCard
            label="Acceptés"
            value={byStatus.ACCEPTE?.count ?? 0}
            sub={caAccepte > 0 ? caAccepte.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : undefined}
            accent="text-emerald-600"
          />
          <StatCard
            label="CA signé"
            value={caAccepte.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            accent="text-emerald-700"
          />
        </div>

        {/* Filters */}
        <Suspense>
          <DevisFilters count={devisList.length} total={totalCount} />
        </Suspense>

        {/* Table */}
        <DevisTable devis={devisList as any} />
      </div>
    </div>
  )
}
