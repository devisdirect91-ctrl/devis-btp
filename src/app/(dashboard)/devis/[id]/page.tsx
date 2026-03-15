import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle2, Circle, Send, FileCheck, XCircle, CalendarClock, Copy, Receipt, FileDown, Edit } from "lucide-react"
import { DevisPreview } from "@/components/devis/devis-preview"
import { DevisActions } from "@/components/devis/devis-actions"
import { GenerateInvoiceButton } from "@/components/devis/GenerateInvoiceButton"
import { SendEmailButton } from "@/components/devis/SendEmailButton"
import { STATUS_LABELS, STATUS_STYLES, clientDisplayName } from "@/lib/client-utils"
import type { DevisPdfData } from "@/lib/pdf/types"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devis = await prisma.devis.findFirst({ where: { id }, select: { numero: true, titre: true } })
  if (!devis) return {}
  return { title: `${devis.numero} — ${devis.titre}` }
}

function fmtDate(d: Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "long", year: "numeric" })
}

function fmtDatetime(d: Date | null | undefined): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

type TimelineEvent = {
  label: string
  date: Date | null | undefined
  icon: React.ElementType
  done: boolean
  color: string
}

function Timeline({ devis }: {
  devis: {
    status: string
    createdAt: Date
    dateEmission: Date
    dateEnvoi?: Date | null
    dateSignature?: Date | null
    dateValidite?: Date | null
  }
}) {
  const isExpired =
    devis.status === "EN_ATTENTE" && devis.dateValidite && new Date(devis.dateValidite) < new Date()

  const events: TimelineEvent[] = [
    {
      label: "Devis créé",
      date: devis.createdAt,
      icon: Clock,
      done: true,
      color: "text-slate-500 bg-slate-100",
    },
    {
      label: "Émis",
      date: devis.dateEmission,
      icon: FileCheck,
      done: true,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: devis.dateEnvoi ? "Envoyé au client" : "Envoi client",
      date: devis.dateEnvoi,
      icon: Send,
      done: !!devis.dateEnvoi || ["SIGNE", "REFUSE"].includes(devis.status),
      color: "text-blue-700 bg-blue-100",
    },
  ]

  if (devis.status === "SIGNE") {
    events.push({
      label: "Signé",
      date: devis.dateSignature,
      icon: CheckCircle2,
      done: true,
      color: "text-emerald-600 bg-emerald-100",
    })
  } else if (devis.status === "REFUSE") {
    events.push({
      label: "Refusé",
      date: devis.dateSignature,
      icon: XCircle,
      done: true,
      color: "text-red-600 bg-red-100",
    })
  } else if (isExpired) {
    events.push({
      label: "Expiré",
      date: devis.dateValidite,
      icon: CalendarClock,
      done: true,
      color: "text-orange-600 bg-orange-100",
    })
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200" />

      <div className="space-y-4">
        {events.map((ev, i) => {
          const Icon = ev.icon
          return (
            <div key={i} className="flex items-start gap-3 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  ev.done ? ev.color : "text-slate-300 bg-slate-100"
                }`}
              >
                {ev.done ? (
                  <Icon className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className="pt-1 min-w-0">
                <p className={`text-sm font-medium ${ev.done ? "text-slate-800" : "text-slate-400"}`}>
                  {ev.label}
                </p>
                {ev.date && ev.done && (
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDatetime(ev.date)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const [devis, user] = await Promise.all([
    prisma.devis.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: true,
        lignes: { orderBy: { ordre: "asc" } },
        facture: { select: { id: true, numero: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        companyName: true,
        companyLogo: true,
        companyAddress: true,
        companyPostalCode: true,
        companyCity: true,
        companyPhone: true,
        companyEmail: true,
        companySiret: true,
        companyTvaIntra: true,
        companyRcs: true,
        companyFormeJuridique: true,
        companyCapital: true,
        assuranceNom: true,
        assuranceNumero: true,
        couleurPrimaire: true,
      },
    }),
  ])

  if (!devis) notFound()

  const data: DevisPdfData = {
    devis: {
      numero: devis.numero,
      titre: devis.titre,
      status: devis.status,
      dateEmission: devis.dateEmission,
      dateValidite: devis.dateValidite,
      adresseChantier: devis.adresseChantier,
      objetTravaux: devis.objetTravaux,
      dateDebutPrevisionnel: devis.dateDebutPrevisionnel,
      remiseGlobale: devis.remiseGlobale,
      remiseGlobaleType: devis.remiseGlobaleType,
      totalHT: devis.totalHT,
      totalRemise: devis.totalRemise,
      totalTva: devis.totalTva,
      totalTTC: devis.totalTTC,
      acompte: devis.acompte,
      acompteType: devis.acompteType,
      conditionsPaiement: devis.conditionsPaiement,
      delaiExecution: devis.delaiExecution,
      notes: devis.notes,
      mentionsLegales: devis.mentionsLegales,
    },
    client: {
      civilite: (devis.client as any).civilite,
      prenom: devis.client.prenom,
      nom: devis.client.nom,
      societe: devis.client.societe,
      type: devis.client.type,
      adresse: devis.client.adresse,
      codePostal: devis.client.codePostal,
      ville: devis.client.ville,
      telephone: devis.client.telephone,
      portable: devis.client.portable,
      email: devis.client.email,
    },
    lignes: devis.lignes.map((l) => ({
      ligneType: l.ligneType,
      ordre: l.ordre,
      designation: l.designation,
      description: l.description,
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaireHT: l.prixUnitaireHT,
      remise: l.remise,
      tauxTva: l.tauxTva,
      totalHtNet: l.totalHtNet,
      totalTTC: l.totalTTC,
    })),
    user: user ?? {},
  }

  const isExpired =
    devis.status === "EN_ATTENTE" && devis.dateValidite && new Date(devis.dateValidite) < new Date()
  const displayStatus = isExpired ? "EXPIRE" : devis.status

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/devis"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {devis.numero}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[displayStatus]}`}
              >
                {STATUS_LABELS[displayStatus]}
              </span>
              <span className="text-sm font-semibold text-slate-900 truncate hidden md:block">
                {devis.titre}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <SendEmailButton devisId={devis.id} status={devis.status} />
            <DevisActions
              devisId={devis.id}
              numero={devis.numero}
              status={devis.status}
              canEdit={devis.status === "EN_ATTENTE"}
              signatureToken={devis.signatureToken}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
        }
      `}</style>

      {/* Mobile action bar */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex gap-2 print:hidden">
        <a
          href={`/api/devis/${devis.id}/pdf`}
          download={`${devis.numero}.pdf`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 active:bg-emerald-100 rounded-xl transition-colors"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </a>
        {devis.status === "EN_ATTENTE" && (
          <a
            href={`/devis/${devis.id}/modifier`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 active:bg-blue-100 rounded-xl transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </a>
        )}
        <SendEmailButton devisId={devis.id} status={devis.status} />
      </div>

      {/* Main layout: preview left, sidebar right */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-start print:p-0 print:gap-0">
        {/* Preview */}
        <div className="flex-1 min-w-0 w-full print:flex-1">

          {/* ── Vue mobile : cartes empilées ───────────────────────────────── */}
          <div className="md:hidden space-y-3">

            {/* Client */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Client</p>
              <p className="font-semibold text-slate-900">{clientDisplayName(devis.client)}</p>
              {devis.client.adresse && <p className="text-sm text-slate-500 mt-1">{devis.client.adresse}</p>}
              {(devis.client.codePostal || devis.client.ville) && (
                <p className="text-sm text-slate-500">
                  {[devis.client.codePostal, devis.client.ville].filter(Boolean).join(" ")}
                </p>
              )}
              {(devis.client.telephone || devis.client.portable) && (
                <a
                  href={`tel:${devis.client.telephone ?? devis.client.portable}`}
                  className="text-sm text-blue-600 mt-1.5 block"
                >
                  {devis.client.telephone ?? devis.client.portable}
                </a>
              )}
              {devis.client.email && (
                <a href={`mailto:${devis.client.email}`} className="text-sm text-blue-600 block">
                  {devis.client.email}
                </a>
              )}
            </div>

            {/* Informations */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Informations</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Émis le</p>
                  <p className="font-medium text-slate-900">
                    {fmtDate(devis.dateEmission, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {devis.dateValidite && (
                  <div>
                    <p className="text-slate-400 text-xs">Validité</p>
                    <p className={`font-medium ${isExpired ? "text-orange-600" : "text-slate-900"}`}>
                      {fmtDate(devis.dateValidite, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
                {devis.adresseChantier && (
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs">Adresse chantier</p>
                    <p className="font-medium text-slate-900">{devis.adresseChantier}</p>
                  </div>
                )}
                {devis.conditionsPaiement && (
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs">Conditions de paiement</p>
                    <p className="text-slate-700">{devis.conditionsPaiement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Prestations */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Prestations</p>
              </div>
              <div className="divide-y divide-slate-50">
                {devis.lignes.map((l, i) =>
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
                          {l.quantite} {l.unite} × {l.prixUnitaireHT.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {l.totalHtNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Totaux */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="space-y-2 text-sm">
                {devis.totalRemise > 0.005 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Remise</span>
                    <span>− {devis.totalRemise.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Total HT</span>
                  <span className="tabular-nums">
                    {(devis.totalHT - devis.totalRemise).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TVA</span>
                  <span className="tabular-nums">
                    {devis.totalTva.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                  <span>Total TTC</span>
                  <span className="tabular-nums">
                    {devis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {devis.notes && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{devis.notes}</p>
              </div>
            )}

            {/* Signature */}
            {devis.signatureClientNom && devis.dateSignature && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">✓ Devis signé</p>
                <p className="text-sm text-emerald-800">
                  Par <span className="font-semibold">{devis.signatureClientNom}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">{fmtDatetime(devis.dateSignature)}</p>
              </div>
            )}
          </div>

          {/* ── Vue desktop : aperçu PDF ────────────────────────────────────── */}
          <div className="hidden md:block">
            <DevisPreview
              data={data}
              signatureInfo={
                (devis.signatureClientUrl || devis.signatureClient) && devis.signatureClientNom && devis.dateSignature
                  ? {
                      nom: devis.signatureClientNom,
                      date: devis.dateSignature,
                      imageSrc: devis.signatureClientUrl ?? devis.signatureClient ?? "",
                    }
                  : null
              }
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 md:flex-shrink-0 space-y-4 print:hidden">
          {/* Résumé */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Résumé</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Client</span>
                <span className="font-medium text-slate-800 text-right max-w-[140px] truncate">
                  {clientDisplayName(devis.client)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Émis le</span>
                <span className="text-slate-800">{fmtDate(devis.dateEmission, { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              {devis.dateValidite && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Validité</span>
                  <span className={isExpired ? "text-orange-600 font-medium" : "text-slate-800"}>
                    {fmtDate(devis.dateValidite, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between">
                <span className="text-slate-500">Total TTC</span>
                <span className="font-bold text-slate-900">
                  {devis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Historique</h3>
            <Timeline
              devis={{
                status: devis.status,
                createdAt: devis.createdAt,
                dateEmission: devis.dateEmission,
                dateEnvoi: devis.dateEnvoi,
                dateSignature: devis.dateSignature,
                dateValidite: devis.dateValidite,
              }}
            />
          </div>

          {/* Facture card */}
          {devis.status === "SIGNE" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Facturation
              </h3>
              {devis.facture ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Facture générée</p>
                  <a
                    href={`/factures/${devis.facture.id}`}
                    className="flex items-center justify-between w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <span>{devis.facture.numero}</span>
                    <span className="text-xs font-normal">Voir →</span>
                  </a>
                </div>
              ) : (
                <GenerateInvoiceButton
                  devisId={devis.id}
                  totalTTC={devis.totalTTC}
                  acompteDevis={devis.acompte}
                  acompteTypeDevis={devis.acompteType}
                />
              )}
            </div>
          )}

          {/* Refus card */}
          {devis.status === "REFUSE" && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Devis refusé
              </h3>
              {(devis as any).motifRefus ? (
                <div>
                  <p className="text-xs text-red-500 mb-1">Motif indiqué par le client</p>
                  <p className="text-sm text-red-900 leading-snug">{(devis as any).motifRefus}</p>
                </div>
              ) : (
                <p className="text-xs text-red-400 italic">Aucun motif fourni</p>
              )}
              <a
                href={`/devis/${devis.id}/dupliquer`}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                <Copy className="w-4 h-4" />
                Dupliquer et modifier
              </a>
            </div>
          )}

          {/* Client card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</h3>
            <p className="font-semibold text-slate-800">{clientDisplayName(devis.client)}</p>
            {devis.client.adresse && <p className="text-slate-500">{devis.client.adresse}</p>}
            {(devis.client.codePostal || devis.client.ville) && (
              <p className="text-slate-500">
                {[devis.client.codePostal, devis.client.ville].filter(Boolean).join(" ")}
              </p>
            )}
            {devis.client.email && (
              <a href={`mailto:${devis.client.email}`} className="text-blue-600 hover:underline block">
                {devis.client.email}
              </a>
            )}
            {(devis.client.telephone || devis.client.portable) && (
              <p className="text-slate-500">{devis.client.telephone ?? devis.client.portable}</p>
            )}
            <Link
              href={`/clients/${devis.client.id}`}
              className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
            >
              Voir la fiche client →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
