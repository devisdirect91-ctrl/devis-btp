"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  X, Mail, Copy, Check, Loader2, ExternalLink, FileText, MessageSquare,
} from "lucide-react"

interface EmailData {
  consultationUrl: string
  pdfUrl: string
  clientEmail: string
  clientName: string
  clientPrenom: string
  companyName: string
  companyPhone: string
  companyEmail: string
  factureNumero: string
  totalTTC: number
  montantPaye: number
  status: string
  dateEcheance: string | null
  conditionsPaiement: string
}

interface SendFactureEmailModalProps {
  factureId: string
  onClose: () => void
}

function fmtMontant(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function getJoursRetard(dateEcheance: string | null): number {
  if (!dateEcheance) return 0
  return Math.floor((Date.now() - new Date(dateEcheance).getTime()) / 86400000)
}

type EmailType = "rappel" | "relance" | "derniere"

function getEmailType(dateEcheance: string | null): EmailType {
  const jours = getJoursRetard(dateEcheance)
  if (jours > 30) return "derniere"
  if (jours > 0) return "relance"
  return "rappel"
}

function buildSubject(data: EmailData): string {
  const type = getEmailType(data.dateEcheance)
  if (type === "derniere") return `URGENT - Facture ${data.factureNumero} impayée`
  if (type === "relance")  return `Relance facture ${data.factureNumero} - Paiement en retard`
  return `Rappel facture ${data.factureNumero}`
}

function buildBody(data: EmailData): string {
  const type = getEmailType(data.dateEcheance)
  const montantRestant = fmtMontant(data.totalTTC - data.montantPaye)
  const joursRetard = getJoursRetard(data.dateEcheance)
  const signature = [data.companyName, data.companyPhone, data.companyEmail]
    .filter(Boolean).join("\n")

  if (type === "rappel") {
    return [
      `Bonjour ${data.clientName},`,
      "",
      `Je me permets de vous adresser un petit rappel concernant la facture n°${data.factureNumero} d'un montant de ${montantRestant} €.`,
      `La date d'échéance est fixée au ${fmtDate(data.dateEcheance)}.`,
      "",
      "Vous pouvez consulter et télécharger votre facture ici :",
      data.consultationUrl,
      "",
      "Je reste à votre disposition pour toute question.",
      "",
      "Cordialement,",
      signature,
    ].join("\n")
  }

  if (type === "relance") {
    return [
      `Bonjour ${data.clientName},`,
      "",
      `Sauf erreur de ma part, je n'ai pas encore reçu le règlement de la facture n°${data.factureNumero} d'un montant de ${montantRestant} €.`,
      `Cette facture était à régler avant le ${fmtDate(data.dateEcheance)}, soit un retard de ${joursRetard} jour(s).`,
      "",
      "Vous pouvez consulter et télécharger votre facture ici :",
      data.consultationUrl,
      "",
      "Merci de bien vouloir procéder au règlement dans les meilleurs délais.",
      "Si vous avez déjà effectué le paiement, je vous prie de ne pas tenir compte de ce message.",
      "",
      "Cordialement,",
      signature,
    ].join("\n")
  }

  // derniere
  return [
    `Bonjour ${data.clientName},`,
    "",
    `Malgré mes précédents rappels, je constate que la facture n°${data.factureNumero} d'un montant de ${montantRestant} € reste impayée.`,
    `Cette facture est en retard de ${joursRetard} jours (échéance : ${fmtDate(data.dateEcheance)}).`,
    "",
    "Je vous remercie de bien vouloir régulariser cette situation dans les plus brefs délais afin d'éviter d'éventuelles pénalités de retard.",
    "",
    "Facture disponible ici :",
    data.consultationUrl,
    "",
    "Restant à votre disposition,",
    signature,
  ].join("\n")
}

function buildSms(data: EmailData): string {
  const type = getEmailType(data.dateEcheance)
  const montantRestant = fmtMontant(data.totalTTC - data.montantPaye)
  const joursRetard = getJoursRetard(data.dateEcheance)

  if (type === "rappel") {
    return `Bonjour, rappel pour la facture ${data.factureNumero} de ${montantRestant}€ à régler avant le ${fmtDate(data.dateEcheance)}. ${data.companyName}`
  }
  return `Bonjour, la facture ${data.factureNumero} de ${montantRestant}€ est en attente depuis ${joursRetard}j. Merci de régulariser. ${data.companyName}`
}

function buildMailto(data: EmailData): string {
  return `mailto:${encodeURIComponent(data.clientEmail)}?subject=${encodeURIComponent(buildSubject(data))}&body=${encodeURIComponent(buildBody(data))}`
}

const TYPE_LABELS: Record<EmailType, { title: string; color: string; bg: string }> = {
  rappel:   { title: "Rappel de paiement",   color: "text-amber-600",  bg: "bg-amber-100"  },
  relance:  { title: "Relance client",        color: "text-orange-600", bg: "bg-orange-100" },
  derniere: { title: "Dernière relance",      color: "text-red-600",    bg: "bg-red-100"    },
}

export function SendFactureEmailModal({ factureId, onClose }: SendFactureEmailModalProps) {
  const router = useRouter()
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedSms, setCopiedSms] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch(`/api/factures/${factureId}/prepare-envoi`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [factureId])

  const handleOpenMailto = useCallback(async () => {
    if (!data) return
    setSending(true)
    try {
      await fetch(`/api/factures/${factureId}/prepare-envoi`, { method: "POST" })
      window.location.href = buildMailto(data)
      showToast("Messagerie ouverte !")
      setTimeout(() => { router.refresh(); onClose() }, 1500)
    } finally {
      setSending(false)
    }
  }, [data, factureId, router, onClose])

  const handleCopyEmail = useCallback(async () => {
    if (!data) return
    await navigator.clipboard.writeText(`Sujet : ${buildSubject(data)}\n\n${buildBody(data)}`)
    setCopiedEmail(true)
    showToast("Email copié !")
    setTimeout(() => setCopiedEmail(false), 2500)
  }, [data])

  const handleCopySms = useCallback(async () => {
    if (!data) return
    await navigator.clipboard.writeText(buildSms(data))
    setCopiedSms(true)
    showToast("SMS copié !")
    setTimeout(() => setCopiedSms(false), 2500)
  }, [data])

  const type = data ? getEmailType(data.dateEcheance) : "rappel"
  const typeLabel = TYPE_LABELS[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-800 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full ${typeLabel.bg} flex items-center justify-center`}>
              <Mail className={`w-4 h-4 ${typeLabel.color}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{typeLabel.title}</h2>
              {data && <p className="text-xs text-slate-500">{data.clientEmail || "Aucun email"}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !data ? (
            <p className="text-sm text-red-500 text-center py-8">Erreur de chargement.</p>
          ) : (
            <>
              {/* Récapitulatif */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Facture</span>
                  <span className="font-semibold text-slate-800">N°{data.factureNumero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client</span>
                  <span className="font-semibold text-slate-800">{data.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant restant</span>
                  <span className="font-bold text-slate-900">{fmtMontant(data.totalTTC - data.montantPaye)} €</span>
                </div>
                {data.dateEcheance && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Échéance</span>
                    <span className={getJoursRetard(data.dateEcheance) > 0 ? "text-red-600 font-medium" : "text-slate-700"}>
                      {fmtDate(data.dateEcheance)}
                      {getJoursRetard(data.dateEcheance) > 0 && ` (+${getJoursRetard(data.dateEcheance)}j)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Aperçu email */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </p>
                <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Objet</span>
                    <span className="text-slate-800 font-medium">{buildSubject(data)}</span>
                  </div>
                  <pre className="px-4 py-3 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs max-h-48 overflow-y-auto">
                    {buildBody(data)}
                  </pre>
                </div>
              </div>

              {/* Aperçu SMS */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> SMS
                </p>
                <div className="rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-700 leading-relaxed bg-slate-50">
                  {buildSms(data)}
                </div>
              </div>

              {/* Liens rapides */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={data.consultationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Page consultation
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </a>
                <a
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Aperçu PDF
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleCopySms}
            disabled={!data || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {copiedSms ? <Check className="w-4 h-4 text-emerald-600" /> : <MessageSquare className="w-4 h-4" />}
            {copiedSms ? "SMS copié !" : "Copier SMS"}
          </button>
          <button
            type="button"
            onClick={handleCopyEmail}
            disabled={!data || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedEmail ? "Copié !" : "Copier email"}
          </button>
          <button
            type="button"
            onClick={handleOpenMailto}
            disabled={!data || loading || sending}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm ${
              type === "derniere" ? "bg-red-500 hover:bg-red-600"
              : type === "relance" ? "bg-orange-500 hover:bg-orange-600"
              : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Ouvrir ma messagerie
          </button>
        </div>
      </div>
    </div>
  )
}
