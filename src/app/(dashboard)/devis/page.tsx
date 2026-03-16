import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FilePlus, Plus, FileText, CheckCircle, XCircle, Clock, Search } from "lucide-react"
import { DevisFilters } from "@/components/devis/devis-filters"
import { DevisTable } from "@/components/devis/devis-table"
import { DevisStatusSelector } from "@/components/ui/DevisStatusSelector"
import { clientDisplayName } from "@/lib/client-utils"
import type { Prisma } from "@prisma/client"

export const metadata = { title: "Mes devis — BTPoche" }

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
  if (status === "SIGNE") {
    where.status = { in: ["SIGNE", "SIGNE_ELECTRONIQUEMENT"] } as unknown as Prisma.EnumDevisStatusFilter
  } else if (status === "REFUSE") {
    where.status = { in: ["REFUSE", "REFUSE_ELECTRONIQUEMENT"] } as unknown as Prisma.EnumDevisStatusFilter
  } else if (status) {
    where.status = status as Prisma.EnumDevisStatusFilter
  }
  if (periodDates.gte) where.dateEmission = periodDates
  if (montantMin !== undefined) where.totalTTC = { gte: montantMin }
  if (montantMax !== undefined) {
    const existing = where.totalTTC as Prisma.FloatFilter | undefined
    where.totalTTC = { ...(existing ?? {}), lte: montantMax }
  }

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

  const byStatus = Object.fromEntries(
    allStats.map((s) => [s.status, { count: s._count.id, total: s._sum.totalTTC ?? 0 }])
  )
  const totalCount = allStats.reduce((s, r) => s + r._count.id, 0)
  // Regroupe SIGNE + SIGNE_ELECTRONIQUEMENT pour les stats et filtres
  const signeCount = (byStatus.SIGNE?.count ?? 0) + (byStatus.SIGNE_ELECTRONIQUEMENT?.count ?? 0)
  const caSigne = (byStatus.SIGNE?.total ?? 0) + (byStatus.SIGNE_ELECTRONIQUEMENT?.total ?? 0)
  const refuseCount = (byStatus.REFUSE?.count ?? 0) + (byStatus.REFUSE_ELECTRONIQUEMENT?.count ?? 0)

  // Mobile: group by month
  function groupByMonth(items: typeof devisList) {
    const groups: { label: string; key: string; items: typeof devisList }[] = []
    const seen = new Map<string, number>()
    for (const d of items) {
      const date = new Date(d.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!seen.has(key)) {
        seen.set(key, groups.length)
        groups.push({
          key,
          label: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          items: [],
        })
      }
      groups[seen.get(key)!].items.push(d)
    }
    return groups
  }

  const grouped = groupByMonth(devisList)

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════ VERSION MOBILE ═══════════════ */}
      <div className="md:hidden pb-24">

        {/* Header */}
        <div className="bg-white px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mes devis</h1>
              <p className="text-sm text-gray-500">
                {totalCount} devis · {fmt(caSigne)} signés
              </p>
            </div>
            <Link
              href="/devis/nouveau"
              className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Filtres statut — chips cliquables */}
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-4 gap-2">
            <FilterChip
              href="/devis"
              active={!status}
              value={totalCount}
              label="Tous"
              color="gray"
            />
            <FilterChip
              href="/devis?status=EN_ATTENTE"
              active={status === "EN_ATTENTE"}
              value={byStatus.EN_ATTENTE?.count ?? 0}
              label="En attente"
              color="yellow"
            />
            <FilterChip
              href="/devis?status=SIGNE"
              active={status === "SIGNE"}
              value={signeCount}
              label="Signés"
              color="green"
            />
            <FilterChip
              href="/devis?status=REFUSE"
              active={status === "REFUSE"}
              value={refuseCount}
              label="Refusés"
              color="red"
            />
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 pb-3">
          <MobileSearch defaultValue={search} />
        </div>

        {/* Liste groupée par mois */}
        <div className="px-4">
          {devisList.length === 0 ? (
            <div className="text-center py-14">
              {search ? (
                <>
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun résultat pour &quot;{search}&quot;</p>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun devis</p>
                  <Link
                    href="/devis/nouveau"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un devis
                  </Link>
                </>
              )}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.key} className="mb-6">
                {/* Séparateur mois */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group.label}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="space-y-2">
                  {group.items.map((d) => {
                    const clientName = clientDisplayName(d.client)
                    return (
                      <Link
                        key={d.id}
                        href={`/devis/${d.id}`}
                        className="block bg-white rounded-xl border p-4 active:bg-gray-50 transition-colors"
                      >
                        {/* Ligne 1 : client + statut */}
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{clientName}</p>
                          <DevisStatusSelector
                            devisId={d.id}
                            currentStatus={d.status as "EN_ATTENTE" | "SIGNE" | "SIGNE_ELECTRONIQUEMENT" | "REFUSE" | "REFUSE_ELECTRONIQUEMENT"}
                          />
                        </div>

                        {/* Ligne 2 : titre */}
                        {d.titre && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{d.titre}</p>
                        )}

                        {/* Ligne 3 : numéro + date + montant */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="font-mono">{d.numero}</span>
                            <span>·</span>
                            <span>
                              {new Date(d.dateEmission).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-gray-900">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                            }).format(d.totalTTC)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════════ VERSION DESKTOP ═══════════════ */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Header desktop */}
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

          {/* Stats desktop */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: "Total", value: totalCount, accent: "text-slate-900" },
              {
                label: "En attente",
                value: byStatus.EN_ATTENTE?.count ?? 0,
                accent: "text-yellow-600",
              },
              {
                label: "Signés",
                value: signeCount,
                sub: caSigne > 0 ? fmt(caSigne) : undefined,
                accent: "text-emerald-600",
              },
              {
                label: "Refusés",
                value: refuseCount,
                accent: "text-red-600",
              },
              {
                label: "CA signé",
                value: fmt(caSigne),
                accent: "text-emerald-700",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex-1 min-w-[140px]"
              >
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  {s.label}
                </p>
                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Filters */}
          <Suspense>
            <DevisFilters count={devisList.length} total={totalCount} />
          </Suspense>

          {/* Table */}
          <DevisTable devis={devisList as any} />
        </div>
      </div>
    </div>
  )
}

// ─── Composants mobiles ───────────────────────────────────────────────────────

function FilterChip({
  href,
  active,
  value,
  label,
  color,
}: {
  href: string
  active: boolean
  value: number
  label: string
  color: "gray" | "yellow" | "green" | "red"
}) {
  const activeStyles = {
    gray: "bg-gray-900 text-white",
    yellow: "bg-yellow-500 text-white",
    green: "bg-green-500 text-white",
    red: "bg-red-500 text-white",
  }
  const inactiveStyles = {
    gray: "bg-white border text-gray-700",
    yellow: "bg-white border text-yellow-600",
    green: "bg-white border text-green-600",
    red: "bg-white border text-red-600",
  }

  return (
    <Link
      href={href}
      className={`rounded-xl p-2.5 text-center transition-all active:scale-95 ${
        active ? activeStyles[color] : inactiveStyles[color]
      }`}
    >
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] mt-0.5 opacity-80 leading-tight">{label}</p>
    </Link>
  )
}

function MobileSearch({ defaultValue }: { defaultValue: string }) {
  return (
    <form method="GET" action="/devis">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          name="search"
          placeholder="Rechercher un client, numéro…"
          defaultValue={defaultValue}
          className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </form>
  )
}

