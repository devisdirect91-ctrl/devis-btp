"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, Building2, ChevronDown, Plus, X } from "lucide-react"
import { clientDisplayName } from "@/lib/client-utils"

type Client = {
  id: string
  type: string
  nom: string
  prenom?: string | null
  societe?: string | null
  email?: string | null
  ville?: string | null
}

interface ClientSelectProps {
  value: string
  onChange: (clientId: string) => void
  error?: string
}

export function ClientSelect({ value, onChange, error }: ClientSelectProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/clients?limit=200")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = clients.find((c) => c.id === value)
  const filtered = clients.filter((c) => {
    if (!search) return true
    const name = clientDisplayName(c).toLowerCase()
    return (
      name.includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.ville?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch("") }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-lg bg-white text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? "border-red-300" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              {selected.type === "PROFESSIONNEL" ? (
                <Building2 className="w-3 h-3 text-slate-500" />
              ) : (
                <User className="w-3 h-3 text-slate-500" />
              )}
            </div>
            <span className="font-medium text-slate-900 truncate">{clientDisplayName(selected)}</span>
            {selected.ville && <span className="text-xs text-slate-400 flex-shrink-0">{selected.ville}</span>}
          </div>
        ) : (
          <span className="text-slate-400">Sélectionner un client…</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange("") }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border-0 focus:outline-none bg-slate-50 rounded-lg"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Aucun résultat</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setIsOpen(false); setSearch("") }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {c.type === "PROFESSIONNEL" ? (
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{clientDisplayName(c)}</p>
                    {(c.email || c.ville) && (
                      <p className="text-xs text-slate-400 truncate">
                        {[c.email, c.ville].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {c.type === "PROFESSIONNEL" && (
                    <span className="ml-auto text-xs text-blue-600 font-medium flex-shrink-0">Pro</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-slate-100">
            <a
              href="/clients/new"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un nouveau client
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
