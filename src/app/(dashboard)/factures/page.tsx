import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FactureFilters } from "@/components/factures/facture-filters"
import { FactureTable } from "@/components/factures/facture-table"
import type { Prisma } from "@prisma/client"
import { computeFactureStatus, eur } from "@/lib/facture-utils"
import Link from "next/link"
import { FilePlus } from "lucide-react"

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

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string
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
  // Status filter: EN_RETARD is computed, not stored — filter to EN_ATTENTE/PARTIELLEMENT_PAYEE + overdue
  if (status === "EN_RETARD") {
    where.AND = [
      { status: { in: ["EN_ATTENTE", "PARTIELLEMENT_PAYEE"] } },
      { dateEcheance: { lt: now } },
    ]
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
    return st === "EN_ATTENTE" || st === "PARTIELLEMENT_PAYEE"
  })
  const enRetard = allFactures.filter((f) => computeFactureStatus(f.status, new Date(f.dateEcheance)) === "EN_RETARD")

  const factureCeMois = allFactures
    .filter((f) => new Date(f.dateEmission) >= startOfMonth)
    .reduce((s, f) => s + f.totalTTC, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes factures</h1>
            <p className="text-sm text-slate-500 mt-0.5">{allFactures.length} facture{allFactures.length > 1 ? "s" : ""} au total</p>
          </div>
          <Link
            href="/factures/nouveau"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            Nouvelle facture
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StatCard
            label="Facturé ce mois"
            value={eur(factureCeMois)}
            accent="text-slate-900"
          />
          <StatCard
            label="En attente"
            value={String(enAttente.length)}
            sub={eur(enAttente.reduce((s, f) => s + (f.totalTTC - f.montantPaye), 0))}
            accent="text-amber-600"
          />
          <StatCard
            label="En retard"
            value={String(enRetard.length)}
            sub={enRetard.length > 0 ? eur(enRetard.reduce((s, f) => s + (f.totalTTC - f.montantPaye), 0)) : undefined}
            accent={enRetard.length > 0 ? "text-red-600" : "text-slate-400"}
          />
          <StatCard
            label="Encaissé"
            value={eur(totalEncaisse)}
            sub={`/ ${eur(totalFacture)} total`}
            accent="text-emerald-600"
          />
        </div>

        {/* Filters */}
        <Suspense>
          <FactureFilters count={factureList.length} total={allFactures.length} />
        </Suspense>

        {/* Table */}
        <FactureTable factures={factureList.map((f) => ({
          ...f,
          consulted: (f as any).tokens?.[0]?.consultedAt != null,
        })) as any} />
      </div>
    </div>
  )
}
