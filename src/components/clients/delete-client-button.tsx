"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
  devisCount: number
}

export function DeleteClientButton({
  clientId,
  clientName,
  devisCount,
}: DeleteClientButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (devisCount > 0) {
      alert(
        `Impossible de supprimer "${clientName}" : ce client possède ${devisCount} devis. Supprimez d'abord les devis associés.`
      )
      return
    }

    if (!confirm(`Supprimer le client "${clientName}" ? Cette action est irréversible.`)) {
      return
    }

    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue")
        setTimeout(() => setError(null), 4000)
        return
      }

      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Supprimer le client"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </>
  )
}
