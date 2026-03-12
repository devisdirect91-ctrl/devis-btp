"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileDown, Edit, Trash2 } from "lucide-react"

interface DevisActionsProps {
  devisId: string
  numero: string
  status: string
  canEdit: boolean
  signatureToken?: string | null
}

export function DevisActions({ devisId, numero, status, canEdit }: DevisActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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

      {/* Delete */}
      <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
    </div>
  )
}
