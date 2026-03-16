"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"

type DevisStatus = "EN_ATTENTE" | "SIGNE" | "SIGNE_ELECTRONIQUEMENT" | "REFUSE" | "REFUSE_ELECTRONIQUEMENT"

interface Props {
  devisId: string
  currentStatus: DevisStatus
  onStatusChange?: (newStatus: DevisStatus) => void
}

const statusConfig: Record<DevisStatus, { color: string; bgColor: string; dotColor: string; label: string }> = {
  EN_ATTENTE:             { color: "text-yellow-700", bgColor: "bg-yellow-50",  dotColor: "bg-yellow-400", label: "En attente" },
  SIGNE:                  { color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "bg-emerald-500", label: "Signé" },
  SIGNE_ELECTRONIQUEMENT: { color: "text-emerald-700", bgColor: "bg-emerald-50", dotColor: "bg-emerald-500", label: "Signé ⚡" },
  REFUSE:                 { color: "text-red-700",     bgColor: "bg-red-50",     dotColor: "bg-red-500",    label: "Refusé" },
  REFUSE_ELECTRONIQUEMENT:{ color: "text-red-700",     bgColor: "bg-red-50",     dotColor: "bg-red-500",    label: "Refusé ⚡" },
}

const availableStatuses: DevisStatus[] = ["EN_ATTENTE", "SIGNE", "REFUSE"]

export function DevisStatusSelector({ devisId, currentStatus, onStatusChange }: Props) {
  const [status, setStatus] = useState<DevisStatus>(currentStatus)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const canChange = status !== "SIGNE_ELECTRONIQUEMENT" && status !== "REFUSE_ELECTRONIQUEMENT"
  const cfg = statusConfig[status] ?? statusConfig.EN_ATTENTE

  async function changeStatus(newStatus: DevisStatus) {
    if (newStatus === status) { setIsOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/devis/${devisId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
        onStatusChange?.(newStatus)
      }
    } catch (err) {
      console.error("Erreur changement statut:", err)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (canChange && !loading) setIsOpen((o) => !o)
        }}
        disabled={loading}
        title={!canChange ? `${cfg.label} — non modifiable` : undefined}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-opacity
          ${cfg.bgColor} ${cfg.color}
          ${canChange ? "cursor-pointer hover:opacity-80" : "cursor-default"}
          ${loading ? "opacity-50" : ""}
        `}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
        <span>{cfg.label}</span>
        {canChange && <ChevronDown className="w-3 h-3 opacity-60" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
          {availableStatuses.map((s) => {
            const c = statusConfig[s]
            return (
              <button
                key={s}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  changeStatus(s)
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                  s === status ? "bg-slate-50" : ""
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                <span className={`flex-1 font-medium ${c.color}`}>{c.label}</span>
                {s === status && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
