"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/client-utils"

const STATUS_OPTIONS = [
  { value: "EN_ATTENTE", label: "En attente", icon: Clock,        cls: "text-yellow-600 hover:bg-yellow-50" },
  { value: "SIGNE",      label: "Signé",      icon: CheckCircle,  cls: "text-emerald-600 hover:bg-emerald-50" },
  { value: "REFUSE",     label: "Refusé",     icon: XCircle,      cls: "text-red-600 hover:bg-red-50" },
]

export function StatusBadge({ devisId, status }: { devisId: string; status: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current && !btnRef.current.contains(target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setOpen(!open)
  }

  const change = async (newStatus: string) => {
    setOpen(false)
    setLoading(true)
    await fetch(`/api/devis/${devisId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    router.refresh()
  }

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
        >
          {STATUS_OPTIONS.filter((o) => o.value !== status).map((o) => {
            const Icon = o.icon
            return (
              <button
                key={o.value}
                onMouseDown={(e) => { e.preventDefault(); change(o.value) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${o.cls}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {o.label}
              </button>
            )
          })}
        </div>,
        document.body
      )
    : null

  const isLocked = status === "SIGNE_ELECTRONIQUEMENT" || status === "REFUSE_ELECTRONIQUEMENT"
  const lockedTitle = status === "SIGNE_ELECTRONIQUEMENT"
    ? "Signé électroniquement — statut non modifiable"
    : status === "REFUSE_ELECTRONIQUEMENT"
    ? "Refusé électroniquement — statut non modifiable"
    : undefined

  return (
    <>
      <button
        ref={btnRef}
        onClick={isLocked ? undefined : handleOpen}
        disabled={loading || isLocked}
        title={lockedTitle}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity ${
          STATUS_STYLES[status] ?? STATUS_STYLES.EN_ATTENTE
        } ${loading ? "opacity-50" : isLocked ? "cursor-default" : "hover:opacity-80 cursor-pointer"}`}
      >
        {STATUS_LABELS[status] ?? status}
        {!isLocked && <span className="text-[10px] opacity-60">▾</span>}
      </button>
      {!isLocked && dropdown}
    </>
  )
}
