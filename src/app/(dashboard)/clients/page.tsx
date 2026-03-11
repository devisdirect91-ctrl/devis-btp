import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import Link from "next/link"
import { UserPlus, Users } from "lucide-react"
import { Eye, Pencil } from "lucide-react"
import { ClientFilters } from "@/components/clients/client-filters"
import { DeleteClientButton } from "@/components/clients/delete-client-button"
import { clientDisplayName, clientInitials } from "@/lib/client-utils"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  const { search = "", type = "", page: pageStr = "1" } = await searchParams
  const page = Math.max(1, parseInt(pageStr))
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.ClientWhereInput = {
    userId: userId ?? "",
    ...(type === "PARTICULIER" || type === "PROFESSIONNEL"
      ? { type }
      : {}),
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

  const [clients, total] = userId
    ? await Promise.all([
        prisma.client.findMany({
          where,
          include: { _count: { select: { devis: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.client.count({ where }),
      ])
    : [[], 0]

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} client{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
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
        {clients.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            {search || type ? (
              <>
                <p className="font-medium text-slate-700">Aucun résultat</p>
                <p className="text-sm text-slate-400 mt-1">
                  Essayez de modifier vos critères de recherche.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700">Aucun client</p>
                <p className="text-sm text-slate-400 mt-1">
                  Créez votre premier client pour commencer.
                </p>
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Client
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Téléphone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Ville
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Devis
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((client) => {
                    const displayName = clientDisplayName(client)
                    const initials = clientInitials(displayName)
                    const phone = client.telephone || client.portable

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
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
                                <span className="text-xs text-blue-600 font-medium">
                                  Professionnel
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Particulier</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {client.email ? (
                            <a
                              href={`mailto:${client.email}`}
                              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Page {page} sur {totalPages} · {total} clients
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/clients?search=${search}&type=${type}&page=${p}`}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100"
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
  )
}
