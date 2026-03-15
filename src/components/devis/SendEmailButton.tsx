"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { SendEmailModal } from "./SendEmailModal"

interface SendEmailButtonProps {
  devisId: string
  status: string
}

export function SendEmailButton({ devisId, status }: SendEmailButtonProps) {
  const [open, setOpen] = useState(false)

  // Disponible tant que le devis est en attente
  if (status !== "EN_ATTENTE") return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm"
      >
        <Send className="w-4 h-4" />
        Envoyer au client
      </button>

      {open && (
        <SendEmailModal
          devisId={devisId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
