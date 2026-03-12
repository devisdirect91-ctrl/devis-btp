"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  X, Mail, Copy, Check, Loader2, ExternalLink, FileText,
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
  dateEcheance: string | null
  conditionsPaiement: string
}

interface SendFactureEmailModalProps {
  factureId: string
  onClose: () => void
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function buildSubject(data: EmailData): string {
  return `Facture N°${data.factureNumero} — ${eur(data.totalTTC)}`
}

function buildBody(data: EmailData): string {
  const lines: string[] = []
  lines.push(`Bonjour ${data.clientPrenom},`)
  lines.push("")
  lines.push(
    `Veuillez trouver ci-dessous votre facture N°${data.factureNumero} d'un montant de ${eur(data.totalTTC)} TTC.`
  )
  lines.push("")
  lines.push("📄 Consulter votre facture en ligne :")
  lines.push(data.consultationUrl)
  lines.push("")
  if (data.dateEcheance) {
    lines.push(`📅 Date d'échéance : ${fmtDate(data.dateEcheance)}`)
    lines.push("")
  }
  if (data.conditionsPaiement) {
    lines.push("💳 Conditions de paiement :")
    lines.push(data.conditionsPaiement)
    lines.push("")
  }
  lines.push("Merci pour votre confiance.")
  lines.push("")
  lines.push("Cordialement,")
  if (data.companyName) lines.push(data.companyName)
  if (data.companyPhone) lines.push(data.companyPhone)
  if (data.companyEmail) lines.push(data.companyEmail)
  return lines.join("\n")
}

function buildMailto(data: EmailData): string {
  return `mailto:${encodeURIComponent(data.clientEmail)}?subject=${encodeURIComponent(buildSubject(data))}&body=${encodeURIComponent(buildBody(data))}`
}

export function SendFactureEmailModal({ factureId, onClose }: SendFactureEmailModalProps) {
  const router = useRouter()
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
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

  const handleCopy = useCallback(async () => {
    if (!data) return
    await navigator.clipboard.writeText(`Sujet : ${buildSubject(data)}\n\n${buildBody(data)}`)
    setCopied(true)
    showToast("Message copié !")
    setTimeout(() => setCopied(false), 2500)
  }, [data])

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
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Envoyer la facture</h2>
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
                  <span className="text-slate-500">Montant TTC</span>
                  <span className="font-bold text-slate-900">{eur(data.totalTTC)}</span>
                </div>
                {data.dateEcheance && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Échéance</span>
                    <span className="text-slate-700">{fmtDate(data.dateEcheance)}</span>
                  </div>
                )}
              </div>

              {/* Banner info */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex gap-3">
                <Mail className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700 leading-relaxed">
                  Votre messagerie s'ouvrira avec l'email pré-rempli incluant le lien de consultation.
                  Le lien permet aussi de savoir si le client a consulté la facture.
                </p>
              </div>

              {/* Aperçu email */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Objet</span>
                  <span className="text-slate-800 font-medium">{buildSubject(data)}</span>
                </div>
                <pre className="px-4 py-3 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs max-h-48 overflow-y-auto">
                  {buildBody(data)}
                </pre>
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
            onClick={handleCopy}
            disabled={!data || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier le message"}
          </button>
          <button
            type="button"
            onClick={handleOpenMailto}
            disabled={!data || loading || sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Ouvrir ma messagerie
          </button>
        </div>
      </div>
    </div>
  )
}
