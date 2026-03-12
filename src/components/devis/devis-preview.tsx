import type { DevisPdfData } from "@/lib/pdf/types"

const UNITE_LABELS: Record<string, string> = {
  UNITE: "u",
  HEURE: "h",
  JOUR: "j",
  METRE: "m",
  METRE_CARRE: "m²",
  METRE_CUBE: "m³",
  METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait",
  ENSEMBLE: "Ens.",
  KILOGRAMME: "kg",
  TONNE: "t",
  LITRE: "L",
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function tvaDetails(
  lignes: DevisPdfData["lignes"],
  totalHT: number,
  remiseGlobale: number,
  remiseGlobaleType: string
) {
  const totalRemise =
    remiseGlobaleType === "PERCENT"
      ? totalHT * (remiseGlobale / 100)
      : Math.min(remiseGlobale, totalHT)
  const totalHtNet = totalHT - totalRemise
  const remiseRatio = totalHT > 0 ? totalHtNet / totalHT : 1
  const map = new Map<number, { base: number; montant: number }>()
  for (const l of lignes.filter((l) => l.ligneType === "LINE")) {
    const htFinal = Math.round(l.totalHtNet * remiseRatio * 100) / 100
    const tva = Math.round(htFinal * (l.tauxTva / 100) * 100) / 100
    const ex = map.get(l.tauxTva) ?? { base: 0, montant: 0 }
    map.set(l.tauxTva, {
      base: Math.round((ex.base + htFinal) * 100) / 100,
      montant: Math.round((ex.montant + tva) * 100) / 100,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([taux, v]) => ({ taux, ...v }))
}

interface SignatureInfo {
  nom: string
  date: Date
  /** URL Supabase Storage ou data URL base64 */
  imageSrc: string
}

interface DevisPreviewProps {
  data: DevisPdfData
  signatureInfo?: SignatureInfo | null
}

export function DevisPreview({ data: { devis: d, client, lignes, user }, signatureInfo }: DevisPreviewProps) {
  const primary = user.couleurPrimaire ?? "#1d4ed8"

  const clientName =
    client.type === "PROFESSIONNEL" && client.societe
      ? client.societe
      : [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ")

  const totalHtNet = d.totalHT - d.totalRemise
  const tva = tvaDetails(lignes, d.totalHT, d.remiseGlobale, d.remiseGlobaleType)
  const acompteMontant =
    d.acompteType === "PERCENT"
      ? Math.round(d.totalTTC * (d.acompte / 100) * 100) / 100
      : Math.min(d.acompte, d.totalTTC)
  const netAPayer = Math.round((d.totalTTC - acompteMontant) * 100) / 100
  const hasRemise = d.totalRemise > 0.005

  return (
    <div
      id="devis-preview"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      className="w-[794px] min-h-[1123px] bg-white shadow-2xl mx-auto text-[13px] text-slate-900 print:shadow-none print:w-full"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-10 pt-10 pb-6 flex justify-between items-start gap-8">
        {/* Company */}
        <div className="flex flex-col gap-0.5 max-w-[240px]">
          {user.companyLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.companyLogo} alt="Logo" className="h-12 object-contain object-left mb-2" />
          )}
          {user.companyName && (
            <p className="font-bold text-base" style={{ color: primary }}>
              {user.companyName}
            </p>
          )}
          {user.companyFormeJuridique && (
            <p className="text-xs text-slate-500">{user.companyFormeJuridique}</p>
          )}
          {user.companyAddress && <p className="text-xs text-slate-600">{user.companyAddress}</p>}
          {(user.companyPostalCode || user.companyCity) && (
            <p className="text-xs text-slate-600">
              {[user.companyPostalCode, user.companyCity].filter(Boolean).join(" ")}
            </p>
          )}
          {user.companyPhone && (
            <p className="text-xs text-slate-500">Tél : {user.companyPhone}</p>
          )}
          {user.companyEmail && (
            <p className="text-xs text-slate-500">{user.companyEmail}</p>
          )}
          {user.companySiret && (
            <p className="text-xs text-slate-500">SIRET : {user.companySiret}</p>
          )}
          {user.companyTvaIntra && (
            <p className="text-xs text-slate-500">TVA intra. : {user.companyTvaIntra}</p>
          )}
        </div>

        {/* Devis identity + Destinataire */}
        <div className="text-right flex-shrink-0 flex flex-col gap-3">
          <div>
            <p className="font-black text-4xl tracking-tight mb-1" style={{ color: primary }}>
              DEVIS
            </p>
            <p className="font-mono font-bold text-sm text-slate-800">{d.numero}</p>
            <p className="text-xs text-slate-500 mt-1">Émis le {fmtDate(d.dateEmission)}</p>
            {d.dateValidite && (
              <p className="text-xs text-slate-500">
                Valable jusqu&apos;au {fmtDate(d.dateValidite)}
              </p>
            )}
          </div>

          {/* Destinataire */}
          <div className="border border-slate-200 rounded-lg p-4 text-left w-[220px] self-end">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: primary }}>
              Destinataire
            </p>
            <p className="font-bold text-slate-900 text-sm">{clientName}</p>
            {client.adresse && <p className="text-xs text-slate-600 mt-0.5">{client.adresse}</p>}
            {(client.codePostal || client.ville) && (
              <p className="text-xs text-slate-600">
                {[client.codePostal, client.ville].filter(Boolean).join(" ")}
              </p>
            )}
            {client.telephone && (
              <p className="text-xs text-slate-500 mt-1">Tél : {client.telephone}</p>
            )}
            {client.portable && (
              <p className="text-xs text-slate-500">Mob : {client.portable}</p>
            )}
            {client.email && (
              <p className="text-xs text-slate-500">{client.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-10 h-0.5 rounded" style={{ backgroundColor: primary }} />

      {/* ── Titre ──────────────────────────────────────────────────────────── */}
      <div className="mx-10 mt-4 mb-4 px-4 py-2.5 rounded text-white font-semibold text-sm" style={{ backgroundColor: primary }}>
        {d.titre}
      </div>

      {/* ── Table prestations ──────────────────────────────────────────────── */}
      <div className="mx-10 mb-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-white text-[11px]" style={{ backgroundColor: primary }}>
              <th className="text-left px-3 py-2.5 rounded-tl font-semibold">Désignation</th>
              <th className="text-right px-2 py-2.5 w-[52px] font-semibold">Qté</th>
              <th className="text-center px-1 py-2.5 w-[42px] font-semibold">U.</th>
              <th className="text-right px-2 py-2.5 w-[80px] font-semibold">P.U. HT</th>
              <th className="text-right px-2 py-2.5 w-[46px] font-semibold">Rem.</th>
              <th className="text-right px-2 py-2.5 w-[42px] font-semibold">TVA</th>
              <th className="text-right px-3 py-2.5 w-[80px] rounded-tr font-semibold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, idx) => {
              if (l.ligneType === "SECTION") {
                return (
                  <tr key={idx} className="bg-slate-100">
                    <td colSpan={7} className="px-3 py-2 font-bold text-[11px]" style={{ color: primary }}>
                      {l.designation}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2.5 border-b border-slate-100">
                    <p className="font-medium text-slate-900 text-[12px]">{l.designation}</p>
                    {l.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{l.description}</p>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right border-b border-slate-100 tabular-nums">
                    {l.quantite % 1 === 0 ? l.quantite : l.quantite.toFixed(2)}
                  </td>
                  <td className="px-1 py-2.5 text-center border-b border-slate-100 text-slate-500">
                    {UNITE_LABELS[l.unite] ?? l.unite}
                  </td>
                  <td className="px-2 py-2.5 text-right border-b border-slate-100 tabular-nums">
                    {eur(l.prixUnitaireHT)}
                  </td>
                  <td className="px-2 py-2.5 text-right border-b border-slate-100 text-slate-500">
                    {l.remise > 0 ? `${l.remise} %` : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right border-b border-slate-100 text-slate-500">
                    {l.tauxTva} %
                  </td>
                  <td className="px-3 py-2.5 text-right border-b border-slate-100 font-semibold tabular-nums">
                    {eur(l.totalHtNet)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Conditions + Totaux ────────────────────────────────────────────── */}
      <div className="mx-10 mb-6 flex gap-6 items-start">
        {/* Conditions */}
        <div className="flex-1 space-y-3 text-xs text-slate-600">
          {d.conditionsPaiement && (
            <div>
              <p className="font-bold text-[10px] uppercase tracking-wider mb-1" style={{ color: primary }}>
                Conditions de paiement
              </p>
              <p className="leading-relaxed">{d.conditionsPaiement}</p>
            </div>
          )}
          {d.delaiExecution && (
            <div>
              <p className="font-bold text-[10px] uppercase tracking-wider mb-1" style={{ color: primary }}>
                Délai d&apos;exécution
              </p>
              <p>{d.delaiExecution}</p>
            </div>
          )}
          {d.notes && (
            <div>
              <p className="font-bold text-[10px] uppercase tracking-wider mb-1" style={{ color: primary }}>
                Notes
              </p>
              <p className="leading-relaxed">{d.notes}</p>
            </div>
          )}
        </div>

        {/* Totaux */}
        <div className="w-56 bg-slate-50 rounded-xl p-4 text-xs space-y-1.5 flex-shrink-0">
          {hasRemise && (
            <>
              <div className="flex justify-between text-slate-500">
                <span>Total HT brut</span>
                <span className="tabular-nums">{eur(d.totalHT)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Remises</span>
                <span className="tabular-nums">− {eur(d.totalRemise)}</span>
              </div>
              <div className="border-t border-slate-200 my-1" />
            </>
          )}
          <div className="flex justify-between font-semibold text-slate-800">
            <span>Total HT {hasRemise ? "net" : ""}</span>
            <span className="tabular-nums">{eur(totalHtNet)}</span>
          </div>

          <div className="border-t border-slate-200 my-1" />

          {tva.map((t) => (
            <div key={t.taux} className="flex justify-between text-slate-500">
              <span>TVA {t.taux} % ({eur(t.base)})</span>
              <span className="tabular-nums">{eur(t.montant)}</span>
            </div>
          ))}

          <div className="border-t border-slate-200 my-1" />

          <div className="flex justify-between font-bold text-sm" style={{ color: primary }}>
            <span>Total TTC</span>
            <span className="tabular-nums">{eur(d.totalTTC)}</span>
          </div>

          {acompteMontant > 0 && (
            <>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>
                  Acompte{d.acompteType === "PERCENT" ? ` (${d.acompte} %)` : ""}
                </span>
                <span className="tabular-nums">{eur(acompteMontant)}</span>
              </div>
              <div className="border-t border-slate-200 my-1" />
              <div className="flex justify-between font-bold text-slate-900">
                <span>Net à payer</span>
                <span className="tabular-nums">{eur(netAPayer)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Signature ──────────────────────────────────────────────────────── */}
      {signatureInfo ? (
        <div className="mx-10 mb-6 border border-emerald-300 bg-emerald-50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-700">
              Devis accepté et signé électroniquement
            </p>
          </div>
          <div className="flex gap-6 items-start">
            <div className="flex-1 space-y-1.5 text-[11px]">
              <div className="flex gap-2">
                <span className="text-slate-500 w-20 flex-shrink-0">Signataire</span>
                <span className="font-semibold text-slate-800">{signatureInfo.nom}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-20 flex-shrink-0">Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(signatureInfo.date).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="border border-emerald-200 bg-white rounded-lg p-2 h-20 w-36 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureInfo.imageSrc}
                alt="Signature"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-10 mb-6 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-[10px] uppercase tracking-wider mb-4" style={{ color: primary }}>
            Bon pour accord
          </p>
          <div className="flex gap-8">
            <div className="w-32">
              <p className="text-xs text-slate-500 mb-2">Date :</p>
              <div className="h-16 border border-slate-200 rounded-lg" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">
                Signature (précédée de la mention « Lu et approuvé ») :
              </p>
              <div className="h-16 border border-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      {(d.mentionsLegales || user.assuranceNom) && (
        <div className="mx-10 pb-8">
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 leading-relaxed space-y-1">
            {d.mentionsLegales && <p>{d.mentionsLegales}</p>}
            {user.assuranceNom && (
              <p>
                Assurance décennale : {user.assuranceNom}
                {user.assuranceNumero ? ` — n° ${user.assuranceNumero}` : ""}
              </p>
            )}
            {(user.companyRcs || user.companyCapital) && (
              <p>
                {user.companyRcs ? `RCS ${user.companyRcs}` : ""}
                {user.companyRcs && user.companyCapital ? " — " : ""}
                {user.companyCapital ? `Capital ${user.companyCapital}` : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
