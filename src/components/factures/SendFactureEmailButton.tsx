"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { SendFactureEmailModal } from "./SendFactureEmailModal"

interface SendFactureEmailButtonProps {
  factureId: string
  clientEmail?: string | null
}

export function SendFactureEmailButton({ factureId, clientEmail }: SendFactureEmailButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={!clientEmail ? "Aucun email pour ce client" : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm"
      >
        <Mail className="w-4 h-4" />
        Envoyer au client
      </button>

      {open && (
        <SendFactureEmailModal
          factureId={factureId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
