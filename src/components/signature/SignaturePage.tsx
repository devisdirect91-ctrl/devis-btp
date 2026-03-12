"use client"

import { useState } from "react"
import {
  CheckCircle, XCircle, Loader2, AlertCircle, ThumbsDown,
  PenLine, Download, Phone, Mail, Building2,
} from "lucide-react"
import { SignatureModal } from "./SignatureModal"
import type { SignatureModalLigne, SignatureModalDevis } from "./SignatureModal"

const UNITE_LABELS: Record<string, string> = {
  UNITE: "u", HEURE: "h", JOUR: "j", METRE: "m",
  METRE_CARRE: "m²", METRE_CUBE: "m³", METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait", ENSEMBLE: "Ens.", KILOGRAMME: "kg", TONNE: "t", LITRE: "L",
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtDateLong(d: string | Date | null | undefined) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface Ligne extends SignatureModalLigne {
  ordre: number
  remise: number
  tauxTva: number
  totalTTC: number
}

interface Client {
  civilite?: string | null
  prenom?: string | null
  nom: string
  societe?: string | null
  type: string
  adresse?: string | null
  codePostal?: string | null
  ville?: string | null
  telephone?: string | null
  email?: string | null
}

interface DevisData extends SignatureModalDevis {
  id: string
  status: string
  signatureClient?: string | null
  signatureClientUrl?: string | null
  signatureClientNom?: string | null
  dateSignature?: string | null
}

interface UserData {
  companyName?: string | null
  companyLogo?: string | null
  companyAddress?: string | null
  companyPostalCode?: string | null
  companyCity?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companySiret?: string | null
  couleurPrimaire?: string | null
}

interface Props {
  token: string
  devis: DevisData
  client: Client
  lignes: Ligne[]
  user: UserData
}

export function SignaturePage({ token, devis, client, lignes, user }: Props) {
  const primary = user.couleurPrimaire ?? "#1d4ed8"
  const alreadyDone = devis.status === "ACCEPTE" || devis.status === "REFUSE"

  const [pageState, setPageState] = useState<"view" | "refuse-confirm" | "done">(
    alreadyDone ? "done" : "view"
  )
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<"ACCEPTE" | "REFUSE" | null>(
    devis.status === "ACCEPTE" ? "ACCEPTE" : devis.status === "REFUSE" ? "REFUSE" : null
  )
  const [signataireName, setSignataireName] = useState(devis.signatureClientNom ?? "")
  const [signedAt, setSignedAt] = useState<string | null>(devis.dateSignature ?? null)
  const [signatureImg, setSignatureImg] = useState<string | null>(
    devis.signatureClientUrl ?? devis.signatureClient ?? null
  )
  const [motifRefus, setMotifRefus] = useState("")

  const clientName = client.type === "PROFESSIONNEL" && client.societe
    ? client.societe
    : [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ")

  const acompteMontant = devis.acompteType === "PERCENT"
    ? Math.round(devis.totalTTC * (devis.acompte / 100) * 100) / 100
    : Math.min(devis.acompte, devis.totalTTC)
  const netAPayer = Math.round((devis.totalTTC - acompteMontant) * 100) / 100
  const hasRemise = devis.totalRemise > 0.005

  const handleModalSuccess = (nom: string) => {
    setSignataireName(nom)
    setSignedAt(new Date().toISOString())
    setResult("ACCEPTE")
    setPageState("done")
    setShowModal(false)
  }

  const submitRefuse = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REFUSE", nom: clientName, motif: motifRefus.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue")
        setLoading(false)
        return
      }
      setResult("REFUSE")
      setPageState("done")
    } catch {
      setError("Erreur réseau. Réessayez.")
      setLoading(false)
    }
  }

  const headerBg = `${primary}0d`
  const headerBorder = `${primary}25`

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: primary }}>
                {user.companyName?.slice(0, 2).toUpperCase() ?? "DB"}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{user.companyName ?? "Entreprise"}</p>
                <p className="text-xs text-slate-500">Devis {devis.numero}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total TTC</p>
              <p className="font-bold" style={{ color: primary }}>{eur(devis.totalTTC)}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* Devis card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              style={{ backgroundColor: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{devis.titre}</h1>
                <p className="text-sm text-slate-500 mt-0.5">Devis n° {devis.numero}</p>
              </div>
              <div className="text-right text-sm text-slate-600 space-y-0.5">
                <p>Émis le {fmtDate(devis.dateEmission)}</p>
                {devis.dateValidite && (
                  <p>Valable jusqu&apos;au <span className="font-medium text-slate-900">{fmtDate(devis.dateValidite)}</span></p>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="px-6 py-4 grid sm:grid-cols-2 gap-6 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">De</p>
                <p className="font-semibold text-slate-900">{user.companyName}</p>
                {user.companyAddress && <p className="text-sm text-slate-600">{user.companyAddress}</p>}
                {(user.companyPostalCode || user.companyCity) && (
                  <p className="text-sm text-slate-600">{[user.companyPostalCode, user.companyCity].filter(Boolean).join(" ")}</p>
                )}
                {user.companyPhone && <p className="text-sm text-slate-600">{user.companyPhone}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pour</p>
                <p className="font-semibold text-slate-900">{clientName}</p>
                {client.adresse && <p className="text-sm text-slate-600">{client.adresse}</p>}
                {(client.codePostal || client.ville) && (
                  <p className="text-sm text-slate-600">{[client.codePostal, client.ville].filter(Boolean).join(" ")}</p>
                )}
                {client.email && <p className="text-sm text-slate-600">{client.email}</p>}
              </div>
            </div>

            {/* Lignes */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-6 py-3 text-left">Désignation</th>
                    <th className="px-3 py-3 text-right w-20">Qté</th>
                    <th className="px-3 py-3 text-right w-28">P.U. HT</th>
                    <th className="px-3 py-3 text-right w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, i) =>
                    l.ligneType === "SECTION" ? (
                      <tr key={i} className="bg-slate-50">
                        <td colSpan={4} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wide">
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
                  <span>Total HT</span><span>{eur(devis.totalHT)}</span>
                </div>
                {hasRemise && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Remise</span><span>− {eur(devis.totalRemise)}</span>
                  </div>
                )}
                {hasRemise && (
                  <div className="flex justify-between text-slate-600">
                    <span>HT net</span><span>{eur(devis.totalHT - devis.totalRemise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>TVA</span><span>{eur(devis.totalTva)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2" style={{ color: primary }}>
                  <span>Total TTC</span><span>{eur(devis.totalTTC)}</span>
                </div>
                {devis.acompte > 0 && <>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Acompte ({devis.acompteType === "PERCENT" ? `${devis.acompte}%` : eur(devis.acompte)})</span>
                    <span>− {eur(acompteMontant)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Net à payer</span><span>{eur(netAPayer)}</span>
                  </div>
                </>}
              </div>
            </div>

            {/* Conditions */}
            {(devis.conditionsPaiement || devis.delaiExecution || devis.notes) && (
              <div className="px-6 py-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4 text-sm">
                {devis.conditionsPaiement && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Conditions de paiement</p>
                    <p className="text-slate-600 whitespace-pre-line">{devis.conditionsPaiement}</p>
                  </div>
                )}
                {devis.delaiExecution && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Délai d&apos;exécution</p>
                    <p className="text-slate-600">{devis.delaiExecution}</p>
                  </div>
                )}
                {devis.notes && (
                  <div className="sm:col-span-2">
                    <p className="font-semibold text-slate-700 mb-1">Notes</p>
                    <p className="text-slate-600 whitespace-pre-line">{devis.notes}</p>
                  </div>
                )}
              </div>
            )}
            {devis.mentionsLegales && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500 whitespace-pre-line">{devis.mentionsLegales}</p>
              </div>
            )}
          </div>

          {/* ── ACTION ZONE ─────────────────────────────────────────── */}

          {pageState === "view" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-1">Votre réponse</h2>
              <p className="text-sm text-slate-500 mb-5">
                Acceptez ce devis en le signant électroniquement, ou refusez-le.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  style={{ backgroundColor: primary, boxShadow: `0 4px 14px ${primary}40` }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 shadow-lg active:scale-[0.98]"
                >
                  <PenLine className="w-4 h-4" />
                  Accepter et signer
                </button>
                <button
                  onClick={() => setPageState("refuse-confirm")}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </button>
              </div>
            </div>
          )}

          {pageState === "refuse-confirm" && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900 mb-1">Vous souhaitez refuser ce devis ?</h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Cette action est définitive. L&apos;entreprise sera notifiée de votre refus.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Motif du refus <span className="text-slate-400 font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      placeholder="Ex : tarif trop élevé, délai incompatible…"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 placeholder-slate-400"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setPageState("view"); setError("") }}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submitRefuse}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pageState === "done" && result === "ACCEPTE" && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Merci ! Votre devis est accepté.</h2>
                <p className="text-slate-600 text-sm mb-1">
                  Vous avez accepté et signé le devis <span className="font-semibold">{devis.numero}</span>.
                </p>
                <p className="text-slate-500 text-sm">Une confirmation a été envoyée à votre adresse email.</p>

                {signedAt && (
                  <p className="text-xs text-slate-400 mt-3">
                    Signé le {fmtDateLong(signedAt)}
                    {signataireName ? ` par ${signataireName}` : ""}
                  </p>
                )}

                {/* Signature preview */}
                {signatureImg && (
                  <div className="mt-4 inline-block border border-emerald-200 rounded-xl overflow-hidden bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signatureImg} alt="Signature" className="max-h-16 max-w-48 object-contain" />
                  </div>
                )}
              </div>

              {/* Récap + PDF */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Récapitulatif</h3>
                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Numéro de devis</span>
                    <span className="font-mono font-semibold text-slate-900">{devis.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Objet</span>
                    <span className="font-medium text-slate-900 text-right max-w-48 truncate">{devis.titre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Montant TTC</span>
                    <span className="font-bold text-slate-900">{eur(devis.totalTTC)}</span>
                  </div>
                  {devis.acompte > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acompte à régler</span>
                      <span className="font-semibold" style={{ color: primary }}>{eur(acompteMontant)}</span>
                    </div>
                  )}
                </div>

                <a
                  href={`/api/sign/${token}/pdf`}
                  download={`${devis.numero}-signe.pdf`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  <Download className="w-4 h-4" />
                  Télécharger le PDF signé
                </a>
              </div>

              {/* Contact artisan */}
              {(user.companyPhone || user.companyEmail || user.companyAddress) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    {user.companyName && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium">{user.companyName}</span>
                      </div>
                    )}
                    {(user.companyAddress || user.companyPostalCode || user.companyCity) && (
                      <div className="flex items-start gap-2 text-slate-600 ml-6">
                        <span>
                          {[user.companyAddress, [user.companyPostalCode, user.companyCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {user.companyPhone && (
                      <a href={`tel:${user.companyPhone}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {user.companyPhone}
                      </a>
                    )}
                    {user.companyEmail && (
                      <a href={`mailto:${user.companyEmail}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {user.companyEmail}
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    N&apos;hésitez pas à nous contacter pour toute question relative à ce devis.
                  </p>
                </div>
              )}
            </div>
          )}

          {pageState === "done" && result === "REFUSE" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Devis refusé</h2>
              <p className="text-slate-600 text-sm mb-4">
                Vous avez refusé ce devis. L&apos;entreprise en a été informée.
              </p>
              {(user.companyPhone || user.companyEmail) && (
                <p className="text-sm text-slate-500">
                  Pour discuter d&apos;un autre devis, contactez-nous :{" "}
                  {user.companyPhone && <a href={`tel:${user.companyPhone}`} className="text-slate-700 font-medium hover:underline">{user.companyPhone}</a>}
                  {user.companyPhone && user.companyEmail && " · "}
                  {user.companyEmail && <a href={`mailto:${user.companyEmail}`} className="text-slate-700 font-medium hover:underline">{user.companyEmail}</a>}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de signature */}
      {showModal && (
        <SignatureModal
          token={token}
          devis={devis}
          lignes={lignes}
          artisanNom={user.companyName}
          primaryColor={primary}
          onSuccess={handleModalSuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
