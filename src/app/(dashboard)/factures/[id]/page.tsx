import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowLeft, FileDown, Clock,
  AlertCircle, Receipt, FileText, CheckCircle2,
} from "lucide-react"
import { clientDisplayName } from "@/lib/client-utils"
import {
  FACTURE_STATUS_LABELS, FACTURE_STATUS_STYLES,
  computeFactureStatus, eur,
} from "@/lib/facture-utils"
import { FactureDetailActions } from "@/components/factures/facture-detail-actions"
import { PaiementsSection } from "@/components/factures/PaiementsSection"
import { SendFactureEmailButton } from "@/components/factures/SendFactureEmailButton"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const f = await prisma.facture.findFirst({ where: { id }, select: { numero: true } })
  if (!f) return {}
  return { title: `${f.numero} — BTPoche` }
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function fmtDatetime(d: Date | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

const UNITE_LABELS: Record<string, string> = {
  UNITE: "u", HEURE: "h", JOUR: "j", METRE: "m",
  METRE_CARRE: "m²", METRE_CUBE: "m³", METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait", ENSEMBLE: "Ens.", KILOGRAMME: "kg", TONNE: "t", LITRE: "L",
}

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const [facture, user] = await Promise.all([
    prisma.facture.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: true,
        lignes: { orderBy: { ordre: "asc" } },
        acomptes: { orderBy: { datePaiement: "asc" } },
        devis: { select: { id: true, numero: true, titre: true } },
        tokens: { orderBy: { createdAt: "desc" }, take: 1, select: { consultedAt: true, createdAt: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyName: true, couleurPrimaire: true },
    }),
  ])

  if (!facture) notFound()

  const displayStatus = computeFactureStatus(facture.status, facture.dateEcheance)
  const resteAPayer = facture.totalTTC - facture.montantPaye
  const isLate = displayStatus === "EN_RETARD"
  const isPaid = facture.status === "PAYEE"
  const primary = user?.couleurPrimaire ?? "#1d4ed8"

  // TVA breakdown
  const tvaByRate = facture.lignes
    .filter((l) => l.ligneType === "LINE")
    .reduce<Record<number, { base: number; tva: number }>>((acc, l) => {
      const r = l.tauxTva
      if (!acc[r]) acc[r] = { base: 0, tva: 0 }
      acc[r].base += l.totalHtNet
      acc[r].tva += l.totalTva
      return acc
    }, {})

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/factures"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {facture.numero}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FACTURE_STATUS_STYLES[displayStatus]}`}>
              {FACTURE_STATUS_LABELS[displayStatus]}
            </span>
          </div>

          {/* Quick actions — desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <SendFactureEmailButton factureId={facture.id} clientEmail={facture.client.email} />
            <a
              href={`/api/factures/${facture.id}/pdf`}
              download={`${facture.numero}.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </a>
            <FactureDetailActions
              factureId={facture.id}
              factureNumero={facture.numero}
              clientNom={clientDisplayName(facture.client)}
              status={facture.status}
              totalTTC={facture.totalTTC}
              montantPaye={facture.montantPaye}
              clientEmail={facture.client.email}
            />
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex gap-2">
        <a
          href={`/api/factures/${facture.id}/pdf`}
          download={`${facture.numero}.pdf`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 active:bg-emerald-100 rounded-xl transition-colors"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </a>
        <SendFactureEmailButton factureId={facture.id} clientEmail={facture.client.email} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* En-tête facture */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              style={{ backgroundColor: `${primary}0d`, borderBottom: `1px solid ${primary}25` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="w-5 h-5" style={{ color: primary }} />
                  <h1 className="text-xl font-bold text-slate-900">{facture.numero}</h1>
                </div>
                {facture.devis && (
                  <p className="text-xs text-slate-500">
                    Générée depuis{" "}
                    <Link href={`/devis/${facture.devis.id}`} className="text-blue-600 hover:underline">
                      {facture.devis.numero}
                    </Link>
                    {facture.devis.titre ? ` — ${facture.devis.titre}` : ""}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-slate-600 space-y-0.5">
                <p>Émise le <span className="font-medium text-slate-900">{fmtDate(facture.dateEmission)}</span></p>
                <p className={isLate ? "text-red-600 font-semibold" : ""}>
                  Échéance : <span className="font-medium">{fmtDate(facture.dateEcheance)}</span>
                  {isLate && " ⚠️"}
                </p>
              </div>
            </div>

            {/* Parties */}
            <div className="px-6 py-4 grid sm:grid-cols-2 gap-6 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">De</p>
                <p className="font-semibold text-slate-900">{user?.companyName ?? "Mon entreprise"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pour</p>
                <p className="font-semibold text-slate-900">{clientDisplayName(facture.client)}</p>
                {facture.client.adresse && <p className="text-sm text-slate-600">{facture.client.adresse}</p>}
                {(facture.client.codePostal || facture.client.ville) && (
                  <p className="text-sm text-slate-600">
                    {[facture.client.codePostal, facture.client.ville].filter(Boolean).join(" ")}
                  </p>
                )}
                {facture.client.email && <p className="text-sm text-slate-600">{facture.client.email}</p>}
              </div>
            </div>

            {/* Lignes — mobile */}
            <div className="md:hidden divide-y divide-slate-50">
              {facture.lignes.map((l, i) =>
                l.ligneType === "SECTION" ? (
                  <div key={i} className="px-4 py-2 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{l.designation}</p>
                  </div>
                ) : (
                  <div key={i} className="px-4 py-3">
                    <p className="font-medium text-slate-900 text-sm">{l.designation}</p>
                    {l.description && <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        {l.quantite} {UNITE_LABELS[l.unite] ?? l.unite} × {eur(l.prixUnitaireHT)} · TVA {l.tauxTva}%
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{eur(l.totalHtNet)}</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Lignes — desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-6 py-3 text-left">Désignation</th>
                    <th className="px-3 py-3 text-right w-20">Qté</th>
                    <th className="px-3 py-3 text-right w-28">P.U. HT</th>
                    <th className="px-3 py-3 text-right w-20">TVA</th>
                    <th className="px-3 py-3 text-right w-28">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.lignes.map((l, i) =>
                    l.ligneType === "SECTION" ? (
                      <tr key={i} className="bg-slate-50">
                        <td colSpan={5} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wide">
                          {l.designation}
                        </td>
                      </tr>
                    ) : (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-900">{l.designation}</p>
                          {l.description && <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {l.quantite} {UNITE_LABELS[l.unite] ?? l.unite}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">{eur(l.prixUnitaireHT)}</td>
                        <td className="px-3 py-3 text-right text-slate-500">{l.tauxTva}%</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-900">{eur(l.totalHtNet)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="max-w-xs ml-auto space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Total HT</span><span>{eur(facture.totalHT)}</span>
                </div>
                {Object.entries(tvaByRate).map(([rate, { tva }]) => (
                  <div key={rate} className="flex justify-between text-slate-500 text-xs">
                    <span>TVA {rate}%</span><span>{eur(tva)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2" style={{ color: primary }}>
                  <span>Total TTC</span><span>{eur(facture.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Conditions */}
            {(facture.conditionsPaiement || facture.notes) && (
              <div className="px-6 py-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4 text-sm">
                {facture.conditionsPaiement && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Conditions de paiement</p>
                    <p className="text-slate-600 whitespace-pre-line">{facture.conditionsPaiement}</p>
                  </div>
                )}
                {facture.notes && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Notes</p>
                    <p className="text-slate-600 whitespace-pre-line">{facture.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Paiements */}
          <PaiementsSection
            factureId={facture.id}
            factureNumero={facture.numero}
            clientNom={clientDisplayName(facture.client)}
            totalTTC={facture.totalTTC}
            montantPaye={facture.montantPaye}
            clientEmail={facture.client.email}
            status={facture.status}
            acomptes={facture.acomptes.map((a) => ({
              id: a.id,
              montant: a.montant,
              datePaiement: a.datePaiement.toISOString(),
              modePaiement: a.modePaiement,
              reference: a.reference,
              notes: a.notes,
            }))}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 md:flex-shrink-0 space-y-4">
          {/* Résumé */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Résumé</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${FACTURE_STATUS_STYLES[displayStatus]}`}>
                  {FACTURE_STATUS_LABELS[displayStatus]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Émise le</span>
                <span className="text-slate-800">{fmtDate(facture.dateEmission)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${isLate ? "text-red-500 font-medium" : "text-slate-500"}`}>Échéance</span>
                <span className={isLate ? "text-red-600 font-semibold" : "text-slate-800"}>{fmtDate(facture.dateEcheance)}</span>
              </div>
              {facture.modePaiement && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode paiement</span>
                  <span className="text-slate-800">{facture.modePaiement}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total TTC</span>
                  <span className="font-bold text-slate-900">{eur(facture.totalTTC)}</span>
                </div>
                {facture.montantPaye > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encaissé</span>
                    <span className="font-medium text-emerald-600">{eur(facture.montantPaye)}</span>
                  </div>
                )}
                {!isPaid && (
                  <div className="flex justify-between">
                    <span className={isLate ? "text-red-500 font-medium" : "text-slate-500"}>Reste</span>
                    <span className={`font-bold ${isLate ? "text-red-600" : "text-slate-900"}`}>{eur(resteAPayer)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suivi envoi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suivi</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Envoyée</span>
                {facture.dateEnvoi ? (
                  <span className="text-slate-700 text-xs">{fmtDate(facture.dateEnvoi)}</span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Non envoyée</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Consultée</span>
                {facture.tokens[0]?.consultedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {fmtDate(facture.tokens[0].consultedAt)}
                  </span>
                ) : facture.dateEnvoi ? (
                  <span className="text-xs text-amber-600 italic">Pas encore consultée</span>
                ) : (
                  <span className="text-xs text-slate-400 italic">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Alerte retard */}
          {isLate && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Paiement en retard</p>
                <p className="text-xs text-red-500 mt-0.5">Échéance dépassée depuis le {fmtDate(facture.dateEcheance)}</p>
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Historique</h3>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200" />
              <div className="space-y-4">
                <div className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 z-10">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-medium text-slate-800">Créée</p>
                    <p className="text-xs text-slate-400">{fmtDatetime(facture.createdAt)}</p>
                  </div>
                </div>
                {facture.acomptes.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 z-10">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-slate-800">
                        Paiement {eur(a.montant)}
                      </p>
                      <p className="text-xs text-slate-400">{fmtDatetime(a.datePaiement)} · {a.modePaiement}</p>
                    </div>
                  </div>
                ))}
                {isPaid && (
                  <div className="flex items-start gap-3 relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 z-10">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-emerald-700">Soldée</p>
                      {facture.datePaiement && <p className="text-xs text-slate-400">{fmtDatetime(facture.datePaiement)}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</h3>
            <p className="font-semibold text-slate-800">{clientDisplayName(facture.client)}</p>
            {facture.client.adresse && <p className="text-slate-500">{facture.client.adresse}</p>}
            {(facture.client.codePostal || facture.client.ville) && (
              <p className="text-slate-500">{[facture.client.codePostal, facture.client.ville].filter(Boolean).join(" ")}</p>
            )}
            {facture.client.email && (
              <a href={`mailto:${facture.client.email}`} className="text-blue-600 hover:underline block">{facture.client.email}</a>
            )}
            {(facture.client.telephone || facture.client.portable) && (
              <p className="text-slate-500">{facture.client.telephone ?? facture.client.portable}</p>
            )}
            <Link href={`/clients/${facture.client.id}`} className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
              Voir la fiche client →
            </Link>
          </div>

          {/* Lien devis origine */}
          {facture.devis && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Devis d&apos;origine</h3>
              <Link
                href={`/devis/${facture.devis.id}`}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>{facture.devis.numero}</span>
                {facture.devis.titre && <span className="text-slate-500 font-normal truncate">— {facture.devis.titre}</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
