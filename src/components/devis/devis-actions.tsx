"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileDown,
  Printer,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  ChevronDown,
  Link2,
  Check,
} from "lucide-react"

interface DevisActionsProps {
  devisId: string
  numero: string
  status: string
  canEdit: boolean
  signatureToken?: string | null
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; icon: React.ElementType; color: string }[]> = {
  BROUILLON: [
    { label: "Marquer comme envoyé", next: "ENVOYE", icon: Send, color: "text-blue-600" },
  ],
  ENVOYE: [
    { label: "Marquer comme accepté", next: "ACCEPTE", icon: CheckCircle, color: "text-emerald-600" },
    { label: "Marquer comme refusé", next: "REFUSE", icon: XCircle, color: "text-red-600" },
  ],
  ACCEPTE: [],
  REFUSE: [],
}

export function DevisActions({ devisId, numero, status, canEdit, signatureToken }: DevisActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copySignatureLink = () => {
    if (!signatureToken) return
    const url = `${window.location.origin}/signer/${signatureToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const transitions = STATUS_TRANSITIONS[status] ?? []

  const changeStatus = async (newStatus: string) => {
    setIsLoading(true)
    setIsMenuOpen(false)
    try {
      const res = await fetch(`/api/devis/${devisId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer le devis ${numero} ? Cette action est irréversible.`)) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/devis/${devisId}`, { method: "DELETE" })
      if (res.ok) router.push("/devis")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap print:hidden">
      {/* PDF download */}
      <a
        href={`/api/devis/${devisId}/pdf`}
        download={`${numero}.pdf`}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
      >
        <FileDown className="w-4 h-4" />
        PDF
      </a>

      {/* Signature link */}
      {signatureToken && (
        <button
          type="button"
          onClick={copySignatureLink}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
          title="Copier le lien de signature client"
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied ? "Copié !" : "Lien signature"}
        </button>
      )}

      {/* Print */}
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
      >
        <Printer className="w-4 h-4" />
        Imprimer
      </button>

      {/* Duplicate */}
      <a
        href={`/devis/${devisId}/dupliquer`}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
      >
        <Copy className="w-4 h-4" />
        Dupliquer
      </a>

      {/* Edit */}
      {canEdit && (
        <a
          href={`/devis/${devisId}/modifier`}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </a>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Statut
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[200px] overflow-hidden">
                {transitions.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.next}
                      type="button"
                      onClick={() => changeStatus(t.next)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${t.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete */}
      {status === "BROUILLON" && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      )}
    </div>
  )
}
