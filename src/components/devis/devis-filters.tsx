"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Search, X, SlidersHorizontal } from "lucide-react"

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "ENVOYE", label: "Envoyé" },
  { value: "ACCEPTE", label: "Accepté" },
  { value: "REFUSE", label: "Refusé" },
  { value: "EXPIRE", label: "Expiré" },
]

const PERIODS = [
  { value: "", label: "Toutes périodes" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
]

export function DevisFilters({ count, total }: { count: number; total: number }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [search, setSearch] = useState(sp.get("search") ?? "")
  const [showAmount, setShowAmount] = useState(!!(sp.get("montantMin") || sp.get("montantMax")))

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/devis?${params.toString()}`)
    },
    [router, sp]
  )

  useEffect(() => {
    const t = setTimeout(() => push("search", search), 350)
    return () => clearTimeout(t)
  }, [search, push])

  const hasFilters = !!(sp.get("search") || sp.get("status") || sp.get("periode") || sp.get("montantMin") || sp.get("montantMax"))

  const reset = () => {
    setSearch("")
    setShowAmount(false)
    router.push("/devis")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro, client, objet…"
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

        {/* Amount filter toggle */}
        <button
          type="button"
          onClick={() => setShowAmount(!showAmount)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl transition-colors ${
            showAmount || sp.get("montantMin") || sp.get("montantMax")
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Montant
        </button>

        {/* Count + reset */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {count === total ? `${total} devis` : `${count} / ${total}`}
          </span>
          {hasFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Amount range */}
      {showAmount && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-500 flex-shrink-0">Montant TTC entre</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={sp.get("montantMin") ?? ""}
              onChange={(e) => push("montantMin", e.target.value)}
              placeholder="0"
              className="w-28 px-3 py-1.5 pr-6 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
          </div>
          <span className="text-xs text-slate-400">et</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={sp.get("montantMax") ?? ""}
              onChange={(e) => push("montantMax", e.target.value)}
              placeholder="∞"
              className="w-28 px-3 py-1.5 pr-6 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
          </div>
        </div>
      )}
    </div>
  )
}
