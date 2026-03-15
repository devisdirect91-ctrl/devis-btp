import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import Link from "next/link"
import { UserPlus, Users, Eye, Pencil, Plus, Search, Phone, FileText } from "lucide-react"
import { ClientFilters } from "@/components/clients/client-filters"
import { DeleteClientButton } from "@/components/clients/delete-client-button"
import { clientDisplayName, clientInitials } from "@/lib/client-utils"

export const metadata = { title: "Mes clients — DevisBTP" }

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? ""

  const { search = "", type = "", page: pageStr = "1" } = await searchParams
  const page = Math.max(1, parseInt(pageStr))
  const limit = 20
  const skip = (page - 1) * limit

  // ── Where clause desktop (type + search) ─────────────────────────────────
  const desktopWhere: Prisma.ClientWhereInput = {
    userId,
    ...(type === "PARTICULIER" || type === "PROFESSIONNEL" ? { type } : {}),
    ...(search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" } },
            { prenom: { contains: search, mode: "insensitive" } },
            { societe: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { ville: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  // ── Where clause mobile (search only) ────────────────────────────────────
  const mobileWhere: Prisma.ClientWhereInput = {
    userId,
    ...(search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" } },
            { prenom: { contains: search, mode: "insensitive" } },
            { societe: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { telephone: { contains: search, mode: "insensitive" } },
            { ville: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [clientsDesktop, totalDesktop, clientsMobile, statsTotal, caTotal] = await Promise.all([
    prisma.client.findMany({
      where: desktopWhere,
      include: { _count: { select: { devis: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.client.count({ where: desktopWhere }),
    prisma.client.findMany({
      where: mobileWhere,
      include: { _count: { select: { devis: true, factures: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({ where: { userId } }),
    prisma.facture.aggregate({
      where: { userId, status: "PAYEE" },
      _sum: { totalTTC: true },
    }),
  ])

  const totalPages = Math.ceil(totalDesktop / limit)
  const caTotalValue = Number(caTotal._sum.totalTTC ?? 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════ VERSION MOBILE ═══════════════ */}
      <div className="md:hidden pb-24">

        {/* Header */}
        <div className="bg-white px-4 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mes clients</h1>
              <p className="text-sm text-gray-500">
                {statsTotal} clients · {fmt(caTotalValue)} encaissés
              </p>
            </div>
            <Link
              href="/clients/new"
              className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 pt-4 pb-3">
          <form method="GET" action="/clients">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Rechercher un client…"
                defaultValue={search}
                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </form>
        </div>

        {/* Liste */}
        <div className="px-4 space-y-3">
          {clientsMobile.length === 0 ? (
            <MobileEmpty search={search} />
          ) : (
            clientsMobile.map((client) => (
              <MobileClientCard key={client.id} client={client} />
            ))
          )}
        </div>
      </div>

      {/* ═══════════════ VERSION DESKTOP ═══════════════ */}
      <div className="hidden md:block p-8 max-w-7xl mx-auto">
        {/* Header desktop */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalDesktop} client{totalDesktop > 1 ? "s" : ""} enregistré{totalDesktop > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau client
          </Link>
        </div>

        {/* Filters */}
        <Suspense>
          <ClientFilters search={search} type={type} />
        </Suspense>

        {/* Table */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          {clientsDesktop.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-slate-400" />
              </div>
              {search || type ? (
                <>
                  <p className="font-medium text-slate-700">Aucun résultat</p>
                  <p className="text-sm text-slate-400 mt-1">Essayez de modifier vos critères de recherche.</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-slate-700">Aucun client</p>
                  <p className="text-sm text-slate-400 mt-1">Créez votre premier client pour commencer.</p>
                  <Link
                    href="/clients/new"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer un client
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Client</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Téléphone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ville</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Devis</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {clientsDesktop.map((client) => {
                      const displayName = clientDisplayName(client)
                      const initials = clientInitials(displayName)
                      const phone = client.telephone || client.portable
                      return (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/clients/${client.id}`}
                                  className="font-medium text-slate-900 text-sm hover:text-blue-600 transition-colors truncate block"
                                >
                                  {displayName}
                                </Link>
                                {client.type === "PROFESSIONNEL" ? (
                                  <span className="text-xs text-blue-600 font-medium">Professionnel</span>
                                ) : (
                                  <span className="text-xs text-slate-400">Particulier</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.email ? (
                              <a href={`mailto:${client.email}`} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                {client.email}
                              </a>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-500">{phone || "—"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-500">
                              {[client.codePostal, client.ville].filter(Boolean).join(" ") || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                              {client._count.devis} devis
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/clients/${client.id}`}
                                title="Voir la fiche"
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/clients/${client.id}/edit`}
                                title="Modifier"
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <DeleteClientButton
                                clientId={client.id}
                                clientName={displayName}
                                devisCount={client._count.devis}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Page {page} sur {totalPages} · {totalDesktop} clients
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`/clients?search=${search}&type=${type}&page=${p}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composants mobiles ───────────────────────────────────────────────────────

function MobileClientCard({
  client,
}: {
  client: {
    id: string
    nom: string
    prenom: string | null
    societe: string | null
    type: string
    email: string | null
    telephone: string | null
    portable: string | null
    ville: string | null
    _count: { devis: number; factures: number }
  }
}) {
  const displayName = clientDisplayName(client)
  const phone = client.telephone || client.portable

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <Link href={`/clients/${client.id}`} className="block p-4 active:bg-gray-50 transition-colors">
        {/* Ligne 1 : nom + badge PRO */}
        <div className="flex justify-between items-start gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{displayName}</p>
          {client.type === "PROFESSIONNEL" && (
            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
              PRO
            </span>
          )}
        </div>

        {/* Ligne 2 : contact + ville */}
        {(client.email || phone || client.ville) && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {client.email || phone}
            {client.ville && <span> · {client.ville}</span>}
          </p>
        )}

        {/* Ligne 3 : stats */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {client._count.devis} devis
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {client._count.factures} facture{client._count.factures !== 1 ? "s" : ""}
          </span>
        </div>
      </Link>

      {/* Actions rapides */}
      <div className="px-4 pb-3 flex gap-2">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 active:bg-gray-100 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Appeler
          </a>
        )}
        <Link
          href={`/devis/nouveau?clientId=${client.id}`}
          className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-orange-50 text-orange-600 active:bg-orange-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Devis
        </Link>
      </div>
    </div>
  )
}

function MobileEmpty({ search }: { search: string }) {
  return (
    <div className="text-center py-14">
      {search ? (
        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      ) : (
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      )}
      <p className="text-gray-500 text-sm">
        {search ? `Aucun résultat pour "${search}"` : "Vous n'avez pas encore de client"}
      </p>
      {!search && (
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Ajouter un client
        </Link>
      )}
    </div>
  )
}
