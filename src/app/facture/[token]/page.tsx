import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { FileDown, Mail, Phone, Building2, CheckCircle } from "lucide-react"

const UNITE_LABELS: Record<string, string> = {
  UNITE: "u", HEURE: "h", JOUR: "j", METRE: "m",
  METRE_CARRE: "m²", METRE_CUBE: "m³", METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait", ENSEMBLE: "Ens.", KILOGRAMME: "kg", TONNE: "t", LITRE: "L",
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ft = await prisma.factureToken.findUnique({
    where: { token },
    select: { facture: { select: { numero: true } } },
  })
  if (!ft) return { title: "Facture introuvable" }
  return { title: `Facture ${ft.facture.numero}` }
}

export default async function FacturePublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const factureToken = await prisma.factureToken.findUnique({
    where: { token },
    include: {
      facture: {
        include: {
          client: true,
          lignes: { orderBy: { ordre: "asc" } },
          acomptes: { orderBy: { datePaiement: "asc" } },
          user: {
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
              companyFormeJuridique: true,
              companyCapital: true,
              couleurPrimaire: true,
              mentionsLegalesDefaut: true,
            },
          },
        },
      },
    },
  })

  if (!factureToken) notFound()

  if (new Date() > factureToken.expiresAt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-sm">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Lien expiré</h1>
          <p className="text-sm text-slate-500">Ce lien de consultation n'est plus valide. Contactez votre prestataire pour en obtenir un nouveau.</p>
        </div>
      </div>
    )
  }

  // Enregistre la première consultation
  if (!factureToken.consultedAt) {
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
    await prisma.factureToken.update({
      where: { token },
      data: { consultedAt: new Date(), consultedIp: ip },
    })
  }

  const { facture } = factureToken
  const { user } = facture
  const primary = user.couleurPrimaire ?? "#1d4ed8"

  const clientName =
    facture.client.type === "PROFESSIONNEL" && (facture.client as any).societe
      ? (facture.client as any).societe
      : [(facture.client as any).civilite, facture.client.prenom, facture.client.nom]
          .filter(Boolean).join(" ")

  const resteAPayer = Math.max(0, facture.totalTTC - facture.montantPaye)

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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary }}>
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">{user.companyName ?? "Facture"}</span>
          </div>
          <a
            href={`/api/facture/${token}/pdf`}
            download={`${facture.numero}.pdf`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-xl transition-colors"
            style={{ backgroundColor: primary }}
          >
            <FileDown className="w-4 h-4" />
            Télécharger PDF
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Facture card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header facture */}
          <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            style={{ backgroundColor: `${primary}0d`, borderBottom: `2px solid ${primary}` }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primary }}>FACTURE</p>
              <h1 className="text-2xl font-bold text-slate-900">{facture.numero}</h1>
              <p className="text-sm text-slate-500 mt-1">Émise le {fmtDate(facture.dateEmission)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-500">Échéance</p>
              <p className="text-lg font-bold text-slate-900">{fmtDate(facture.dateEcheance)}</p>
              <p className="text-2xl font-bold" style={{ color: primary }}>{eur(facture.totalTTC)}</p>
            </div>
          </div>

          {/* De / Pour */}
          <div className="px-8 py-5 grid sm:grid-cols-2 gap-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">De</p>
              {user.companyLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.companyLogo} alt="Logo" className="h-8 object-contain mb-2" />
              )}
              <p className="font-semibold text-slate-800">{user.companyName}</p>
              {user.companyAddress && <p className="text-sm text-slate-500">{user.companyAddress}</p>}
              {(user.companyPostalCode || user.companyCity) && (
                <p className="text-sm text-slate-500">{[user.companyPostalCode, user.companyCity].filter(Boolean).join(" ")}</p>
              )}
              {user.companySiret && <p className="text-xs text-slate-400 mt-1">SIRET : {user.companySiret}</p>}
              {user.companyTvaIntra && <p className="text-xs text-slate-400">TVA : {user.companyTvaIntra}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pour</p>
              <p className="font-semibold text-slate-800">{clientName}</p>
              {facture.client.adresse && <p className="text-sm text-slate-500">{facture.client.adresse}</p>}
              {(facture.client.codePostal || facture.client.ville) && (
                <p className="text-sm text-slate-500">{[facture.client.codePostal, facture.client.ville].filter(Boolean).join(" ")}</p>
              )}
            </div>
          </div>

          {/* Lignes */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide"
                  style={{ backgroundColor: `${primary}08` }}>
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
                      <td colSpan={5} className="px-6 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: primary }}>
                        {l.designation}
                      </td>
                    </tr>
                  ) : (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{l.designation}</p>
                        {l.description && <p className="text-xs text-slate-400 mt-0.5">{l.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {l.quantite} {UNITE_LABELS[l.unite] ?? l.unite}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{eur(l.prixUnitaireHT)}</td>
                      <td className="px-3 py-3 text-right text-slate-400">{l.tauxTva}%</td>
                      <td className="px-3 py-3 text-right font-medium text-slate-900">{eur(l.totalHtNet)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="px-8 py-5 border-t border-slate-100">
            <div className="max-w-xs ml-auto space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Total HT</span><span className="tabular-nums">{eur(facture.totalHT)}</span>
              </div>
              {Object.entries(tvaByRate).map(([rate, { tva }]) => (
                <div key={rate} className="flex justify-between text-slate-400 text-xs">
                  <span>TVA {rate}%</span><span className="tabular-nums">{eur(tva)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2" style={{ color: primary }}>
                <span>Total TTC</span><span className="tabular-nums">{eur(facture.totalTTC)}</span>
              </div>
              {facture.acomptes.length > 0 && (
                <>
                  {facture.acomptes.map((a, i) => (
                    <div key={i} className="flex justify-between text-emerald-600 text-xs">
                      <span>Acompte {fmtDate(a.datePaiement)}</span>
                      <span className="tabular-nums">− {eur(a.montant)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                    <span>Net à payer</span><span className="tabular-nums">{eur(resteAPayer)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Conditions de paiement */}
          {facture.conditionsPaiement && (
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Conditions de paiement</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{facture.conditionsPaiement}</p>
            </div>
          )}

          {/* Notes */}
          {facture.notes && (
            <div className="px-8 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{facture.notes}</p>
            </div>
          )}

          {/* Mentions légales */}
          {facture.mentionsLegales && (
            <div className="px-8 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 leading-relaxed">{facture.mentionsLegales}</p>
            </div>
          )}
        </div>

        {/* Carte contact artisan */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
              <Building2 className="w-5 h-5" style={{ color: primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{user.companyName}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {user.companyPhone && (
                  <a href={`tel:${user.companyPhone}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {user.companyPhone}
                  </a>
                )}
                {user.companyEmail && (
                  <a href={`mailto:${user.companyEmail}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {user.companyEmail}
                  </a>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <a
                href={`/api/facture/${token}/pdf`}
                download={`${facture.numero}.pdf`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
                style={{ backgroundColor: primary }}
              >
                <FileDown className="w-4 h-4" />
                PDF
              </a>
            </div>
          </div>
        </div>

        {/* Badge déjà consulté */}
        {factureToken.consultedAt && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" />
            Consulté le {fmtDate(factureToken.consultedAt)}
          </div>
        )}
      </div>
    </div>
  )
}
