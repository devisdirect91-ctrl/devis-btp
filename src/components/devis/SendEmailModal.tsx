"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  FileText,
  PenLine,
} from "lucide-react"

interface EmailData {
  signatureUrl: string
  pdfUrl: string
  clientEmail: string
  clientName: string
  companyName: string
  companyPhone: string
  companyEmail: string
  devisNumero: string
  devisTitre: string
  totalTTC: number
  dateValidite: string | null
}

interface SendEmailModalProps {
  devisId: string
  onClose: () => void
}

function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function buildEmailSubject(data: EmailData): string {
  return `Devis ${data.devisNumero} — ${data.devisTitre}`
}

function buildEmailBody(data: EmailData): string {
  const lines: string[] = []
  lines.push(`Bonjour ${data.clientName},`)
  lines.push("")
  lines.push(
    `Veuillez trouver ci-joint mon devis ${data.devisNumero} « ${data.devisTitre} » d'un montant de ${eur(data.totalTTC)}.`
  )
  lines.push("")
  if (data.dateValidite) {
    lines.push(`Ce devis est valable jusqu'au ${fmtDate(data.dateValidite)}.`)
    lines.push("")
  }
  lines.push("📋 Consultez et signez votre devis en ligne :")
  lines.push(data.signatureUrl)
  lines.push("")
  lines.push("⬇️ Télécharger le devis en PDF :")
  lines.push(data.pdfUrl)
  lines.push("")
  lines.push("N'hésitez pas à me contacter pour toute question.")
  lines.push("")
  lines.push("Cordialement,")
  if (data.companyName) lines.push(data.companyName)
  if (data.companyPhone) lines.push(data.companyPhone)
  if (data.companyEmail) lines.push(data.companyEmail)
  return lines.join("\n")
}

function buildMailtoUrl(data: EmailData): string {
  const subject = buildEmailSubject(data)
  const body = buildEmailBody(data)
  return `mailto:${encodeURIComponent(data.clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function SendEmailModal({ devisId, onClose }: SendEmailModalProps) {
  const router = useRouter()
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  useEffect(() => {
    fetch(`/api/devis/${devisId}/prepare-envoi`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [devisId])

  const handleOpenMailto = useCallback(async () => {
    if (!data) return
    setSending(true)
    try {
      await fetch(`/api/devis/${devisId}/prepare-envoi`, { method: "POST" })
      window.location.href = buildMailtoUrl(data)
      showToast("Messagerie ouverte ! Pensez à joindre le PDF.")
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    } finally {
      setSending(false)
    }
  }, [data, devisId, router, onClose])

  const handleCopy = useCallback(async () => {
    if (!data) return
    const text = `Sujet : ${buildEmailSubject(data)}\n\n${buildEmailBody(data)}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    showToast("Message copié dans le presse-papier !")
    setTimeout(() => setCopied(false), 2500)
  }, [data])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Toast */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-800 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Envoyer au client</h2>
              {data && (
                <p className="text-xs text-slate-500">
                  {data.clientEmail || "Aucun email renseigné"}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
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
            <p className="text-sm text-red-500 text-center py-8">Erreur lors du chargement.</p>
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex gap-3">
                <Mail className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700 leading-relaxed">
                  Votre messagerie (Gmail, Outlook…) s'ouvrira avec l'email pré-rempli.
                  Pensez à <strong>joindre le PDF</strong> avant d'envoyer.
                </p>
              </div>

              {/* Email preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                {/* Subject */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Objet</span>
                  <span className="text-slate-800 font-medium">{buildEmailSubject(data)}</span>
                </div>
                {/* Body */}
                <pre className="px-4 py-3 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs max-h-56 overflow-y-auto">
                  {buildEmailBody(data)}
                </pre>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-2">
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
                <a
                  href={data.signatureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5 text-slate-400" />
                  Lien signature
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          {/* Secondary: copy */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!data || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 sm:w-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier le message"}
          </button>

          {/* Primary: open mailto */}
          <button
            type="button"
            onClick={handleOpenMailto}
            disabled={!data || loading || sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Ouvrir dans ma messagerie
          </button>
        </div>
      </div>
    </div>
  )
}
