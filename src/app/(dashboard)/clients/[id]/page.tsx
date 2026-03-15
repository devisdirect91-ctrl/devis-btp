import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Pencil,
  FilePlus,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Building2,
  FileText,
  Hash,
  Globe,
  StickyNote,
} from "lucide-react"
import { clientDisplayName, clientInitials, STATUS_LABELS, STATUS_STYLES } from "@/lib/client-utils"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const client = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: {
      devis: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          numero: true,
          titre: true,
          status: true,
          dateEmission: true,
          dateValidite: true,
          totalHT: true,
          totalTTC: true,
        },
      },
      _count: { select: { devis: true } },
    },
  })

  if (!client) notFound()

  const displayName = clientDisplayName(client)
  const initials = clientInitials(displayName)
  const isPro = client.type === "PROFESSIONNEL"

  const totalAccepte = client.devis
    .filter((d) => d.status === "SIGNE")
    .reduce((sum, d) => sum + d.totalTTC, 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Clients
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-900 font-medium truncate">{displayName}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: client info */}
        <div className="xl:col-span-1 space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {/* Avatar + name + actions */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-lg font-bold flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">{displayName}</h1>
                  <span
                    className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isPro
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isPro ? "Professionnel" : "Particulier"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-6">
              <Link
                href={`/clients/${client.id}/edit`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Link>
              <Link
                href={`/devis/nouveau?clientId=${client.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Nouveau devis
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-500">Devis total</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {client._count.devis}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-emerald-700">Montant accepté</p>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">
                  {totalAccepte.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                  {client.email}
                </a>
              )}
              {client.telephone && (
                <a
                  href={`tel:${client.telephone}`}
                  className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition-colors group"
                >
                  <Phone className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                  {client.telephone}
                </a>
              )}
              {client.portable && (
                <a
                  href={`tel:${client.portable}`}
                  className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition-colors group"
                >
                  <Smartphone className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                  {client.portable}
                </a>
              )}
              {(client.adresse || client.ville) && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {client.adresse && <p>{client.adresse}</p>}
                    {client.complement && <p>{client.complement}</p>}
                    {(client.codePostal || client.ville) && (
                      <p>{[client.codePostal, client.ville].filter(Boolean).join(" ")}</p>
                    )}
                    {client.pays && client.pays !== "France" && <p>{client.pays}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pro details */}
          {isPro && (client.societe || client.siret || client.tvaIntra || client.rcs) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Informations entreprise
              </h3>
              <div className="space-y-3">
                {client.societe && (
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Raison sociale</p>
                      <p className="text-sm text-slate-700 font-medium">{client.societe}</p>
                    </div>
                  </div>
                )}
                {client.siret && (
                  <div className="flex items-center gap-2.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">SIRET</p>
                      <p className="text-sm text-slate-700 font-mono">{client.siret}</p>
                    </div>
                  </div>
                )}
                {client.tvaIntra && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">TVA intracommunautaire</p>
                      <p className="text-sm text-slate-700 font-mono">{client.tvaIntra}</p>
                    </div>
                  </div>
                )}
                {client.rcs && (
                  <div className="flex items-center gap-2.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">RCS</p>
                      <p className="text-sm text-slate-700">{client.rcs}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Notes internes
              </h3>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: devis history */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Historique des devis</h2>
                {client._count.devis > 0 && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-500 font-medium">
                    {client._count.devis}
                  </span>
                )}
              </div>
              <Link
                href={`/devis/nouveau?clientId=${client.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Créer un devis
              </Link>
            </div>

            {client.devis.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">Aucun devis</p>
                <p className="text-sm text-slate-400 mt-1">
                  Ce client n&apos;a pas encore de devis.
                </p>
                <Link
                  href={`/devis/nouveau?clientId=${client.id}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <FilePlus className="w-4 h-4" />
                  Créer le premier devis
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Numéro
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Objet
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Montant TTC
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {client.devis.map((devis) => (
                      <tr
                        key={devis.id}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <Link href={`/devis/${devis.id}`} className="block">
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {devis.numero}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/devis/${devis.id}`}
                            className="font-medium text-slate-900 text-sm hover:text-blue-600 transition-colors"
                          >
                            {devis.titre}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {new Date(devis.dateEmission).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">
                            {devis.totalTTC.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              STATUS_STYLES[devis.status]
                            }`}
                          >
                            {STATUS_LABELS[devis.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
