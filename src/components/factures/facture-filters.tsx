"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Search, X } from "lucide-react"

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "PARTIELLEMENT_PAYEE", label: "Part. payée" },
  { value: "PAYEE", label: "Payée" },
  { value: "EN_RETARD", label: "En retard" },
  { value: "ANNULEE", label: "Annulée" },
]

const PERIODS = [
  { value: "", label: "Toutes périodes" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
]

export function FactureFilters({ count, total }: { count: number; total: number }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [search, setSearch] = useState(sp.get("search") ?? "")

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/factures?${params.toString()}`)
    },
    [router, sp]
  )

  useEffect(() => {
    const t = setTimeout(() => push("search", search), 350)
    return () => clearTimeout(t)
  }, [search, push])

  const hasFilters = !!(sp.get("search") || sp.get("status") || sp.get("periode"))

  const reset = () => {
    setSearch("")
    router.push("/factures")
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Numéro, client…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status */}
      <select
        value={sp.get("status") ?? ""}
        onChange={(e) => push("status", e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Period */}
      <select
        value={sp.get("periode") ?? ""}
        onChange={(e) => push("periode", e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {/* Count + reset */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-400">
          {count === total ? `${total} facture${total > 1 ? "s" : ""}` : `${count} / ${total}`}
        </span>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Effacer
          </button>
        )}
      </div>
    </div>
  )
}
