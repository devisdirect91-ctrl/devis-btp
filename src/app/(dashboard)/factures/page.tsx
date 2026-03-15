import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FactureFilters } from "@/components/factures/facture-filters"
import { FactureTable } from "@/components/factures/facture-table"
import { FactureMobileCard } from "@/components/factures/facture-mobile-card"
import type { Prisma } from "@prisma/client"
import { computeFactureStatus, eur } from "@/lib/facture-utils"
import Link from "next/link"
import { FilePlus, Plus, Search, Receipt, AlertTriangle } from "lucide-react"

export const metadata = { title: "Mes factures — DevisBTP" }

function getPeriodDates(periode: string): { gte?: Date } {
  const now = new Date()
  switch (periode) {
    case "month": return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3)
      return { gte: new Date(now.getFullYear(), q * 3, 1) }
    }
    case "year": return { gte: new Date(now.getFullYear(), 0, 1) }
    default: return {}
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function FacturesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const sp = await searchParams

  const search = sp.search ?? ""
  const status = sp.status ?? ""
  const periode = sp.periode ?? ""

  const periodDates = getPeriodDates(periode)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const where: Prisma.FactureWhereInput = { userId }

  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { client: { nom: { contains: search, mode: "insensitive" } } },
      { client: { prenom: { contains: search, mode: "insensitive" } } },
      { client: { societe: { contains: search, mode: "insensitive" } } },
    ]
  }
  if (status === "EN_RETARD") {
    // EN_RETARD est calculé (pas stocké) : EN_ATTENTE ou PARTIELLEMENT_PAYEE + échéance dépassée
    where.AND = [
      { status: { in: ["EN_ATTENTE", "PARTIELLEMENT_PAYEE"] } },
      { dateEcheance: { lt: now } },
    ]
  } else if (status === "ENCAISSE") {
    // Encaissé = payées + partiellement payées
    where.status = { in: ["PAYEE", "PARTIELLEMENT_PAYEE"] } as Prisma.EnumFactureStatusFilter
  } else if (status) {
    where.status = status as Prisma.EnumFactureStatusFilter
  }
  if (periodDates.gte) where.dateEmission = periodDates

  const [factureList, allFactures] = await Promise.all([
    prisma.facture.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true, societe: true, type: true, email: true } },
        devis: { select: { id: true, numero: true } },
        tokens: { select: { consultedAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facture.findMany({
      where: { userId },
      select: { status: true, totalTTC: true, montantPaye: true, dateEcheance: true, dateEmission: true },
    }),
  ])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalFacture = allFactures.reduce((s, f) => s + f.totalTTC, 0)
  const totalEncaisse = allFactures.reduce((s, f) => s + f.montantPaye, 0)

  const enAttente = allFactures.filter((f) => {
    const st = computeFactureStatus(f.status, new Date(f.dateEcheance))
    return st === "EN_ATTENTE"
  })
  const enRetard = allFactures.filter(
    (f) => computeFactureStatus(f.status, new Date(f.dateEcheance)) === "EN_RETARD"
  )

  const factureCeMois = allFactures
    .filter((f) => new Date(f.dateEmission) >= startOfMonth)
    .reduce((s, f) => s + f.totalTTC, 0)

  const montantEnAttente = allFactures
    .filter((f) => {
      const st = computeFactureStatus(f.status, new Date(f.dateEcheance))
      return st === "EN_ATTENTE" || st === "PARTIELLEMENT_PAYEE"
    })
    .reduce((s, f) => s + (f.totalTTC - f.montantPaye), 0)
  const montantEnRetard = enRetard.reduce((s, f) => s + (f.totalTTC - f.montantPaye), 0)

  // Mobile: group by month
  function groupByMonth(items: typeof factureList) {
    const groups: { label: string; key: string; items: typeof factureList }[] = []
    const seen = new Map<string, number>()
    for (const f of items) {
      const date = new Date(f.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!seen.has(key)) {
        seen.set(key, groups.length)
        groups.push({
          key,
          label: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          items: [],
        })
      }
      groups[seen.get(key)!].items.push(f)
    }
    return groups
  }

  const grouped = groupByMonth(factureList)

  const fmtMontant = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════ VERSION MOBILE ═══════════════ */}
      <div className="md:hidden pb-24">

        {/* Header */}
        <div className="bg-white px-4 py-4 border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes factures</h1>
            <p className="text-sm text-gray-500">
              {fmtMontant(totalEncaisse)} encaissés ·{" "}
              {fmtMontant(montantEnAttente)} en attente
            </p>
          </div>
        </div>

        {/* Stats cliquables */}
        <div className="px-4 pt-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            <MobileFilterChip
              href="/factures?status=ENCAISSE"
              active={status === "ENCAISSE"}
              label="Encaissé"
              subLabel={fmtMontant(totalEncaisse)}
              color="green"
            />
            <MobileFilterChip
              href="/factures?status=EN_ATTENTE"
              active={status === "EN_ATTENTE"}
              label="En attente"
              subLabel={String(enAttente.length)}
              color="yellow"
            />
            <MobileFilterChip
              href="/factures?status=EN_RETARD"
              active={status === "EN_RETARD"}
              label="En retard"
              subLabel={String(enRetard.length)}
              color="red"
              alert={enRetard.length > 0 && !status}
            />
          </div>
        </div>

        {/* Chips filtre texte */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { href: "/factures", label: "Toutes", active: !status },
              { href: "/factures?status=ENCAISSE",   label: "Encaissées", active: status === "ENCAISSE",   activeClass: "bg-green-500 text-white" },
              { href: "/factures?status=EN_ATTENTE", label: "En attente", active: status === "EN_ATTENTE", activeClass: "bg-yellow-500 text-white" },
              { href: "/factures?status=EN_RETARD",  label: "En retard",  active: status === "EN_RETARD",  activeClass: "bg-red-500 text-white" },
            ].map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  chip.active
                    ? (chip as any).activeClass ?? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 pb-3">
          <form method="GET" action="/factures">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Rechercher un client, numéro…"
                defaultValue={search}
                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </form>
        </div>

        {/* Alerte factures en retard */}
        {enRetard.length > 0 && status !== "EN_RETARD" && (
          <div className="px-4 pb-3">
            <Link
              href="/factures?status=EN_RETARD"
              className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  {enRetard.length} facture{enRetard.length > 1 ? "s" : ""} en retard
                </p>
                <p className="text-xs text-red-600">{fmtMontant(montantEnRetard)} à relancer</p>
              </div>
              <span className="text-red-400 flex-shrink-0">→</span>
            </Link>
          </div>
        )}

        {/* Liste groupée par mois */}
        <div className="px-4">
          {factureList.length === 0 ? (
            <div className="text-center py-14">
              {search ? (
                <>
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun résultat pour &quot;{search}&quot;</p>
                </>
              ) : (
                <>
                  <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {status === "EN_RETARD"
                      ? "Aucune facture en retard 🎉"
                      : status === "PAYEE"
                      ? "Aucune facture payée"
                      : status === "EN_ATTENTE"
                      ? "Aucune facture en attente"
                      : "Aucune facture"}
                  </p>
                  {!status && (
                    <Link
                      href="/factures/nouveau"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Créer une facture
                    </Link>
                  )}
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
                  {group.items.map((f) => (
                    <FactureMobileCard key={f.id} facture={f} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════════ VERSION DESKTOP ═══════════════ */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Mes factures</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {allFactures.length} facture{allFactures.length > 1 ? "s" : ""} au total
                </p>
              </div>
              <Link
                href="/factures/nouveau"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
              >
                <FilePlus className="w-4 h-4" />
                Nouvelle facture
              </Link>
            </div>

            {/* Stats desktop */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[
                {
                  label: "Facturé ce mois",
                  value: eur(factureCeMois),
                  accent: "text-slate-900",
                },
                {
                  label: "En attente",
                  value: String(enAttente.length),
                  sub: eur(montantEnAttente),
                  accent: "text-amber-600",
                },
                {
                  label: "En retard",
                  value: String(enRetard.length),
                  sub: enRetard.length > 0 ? eur(montantEnRetard) : undefined,
                  accent: enRetard.length > 0 ? "text-red-600" : "text-slate-400",
                },
                {
                  label: "Encaissé",
                  value: eur(totalEncaisse),
                  sub: `/ ${eur(totalFacture)} total`,
                  accent: "text-emerald-600",
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
              <FactureFilters count={factureList.length} total={allFactures.length} />
            </Suspense>

            {/* Table */}
            <FactureTable
              factures={factureList.map((f) => ({
                ...f,
                consulted: (f as any).tokens?.[0]?.consultedAt != null,
              })) as any}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composants mobiles ───────────────────────────────────────────────────────

function MobileFilterChip({
  href,
  active,
  label,
  subLabel,
  color,
  alert,
}: {
  href: string
  active: boolean
  label: string
  subLabel: string
  color: "green" | "yellow" | "red"
  alert?: boolean
}) {
  const activeStyles = {
    green: "bg-green-500 text-white",
    yellow: "bg-yellow-500 text-white",
    red: "bg-red-500 text-white",
  }
  const inactiveStyles = {
    green: "bg-white border text-green-600",
    yellow: "bg-white border text-yellow-600",
    red: alert ? "bg-red-50 border-red-200 border text-red-600" : "bg-white border text-red-600",
  }

  return (
    <Link
      href={href}
      className={`rounded-xl p-2.5 text-center transition-all active:scale-95 ${
        active ? activeStyles[color] : inactiveStyles[color]
      }`}
    >
      <p className="text-sm font-bold leading-tight truncate">{subLabel}</p>
      <p className="text-[10px] mt-0.5 opacity-80 leading-tight">{label}</p>
    </Link>
  )
}
