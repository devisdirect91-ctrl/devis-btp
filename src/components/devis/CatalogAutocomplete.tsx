"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Package } from "lucide-react"
import { UNITE_LABELS } from "@/lib/catalogue-utils"

export type CatalogSuggestion = {
  id: string
  category: string
  designation: string
  description?: string | null
  unite: string
  prixHT: number
  tauxTva: number
  reference?: string | null
}

interface CatalogAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (item: CatalogSuggestion) => void
  placeholder?: string
  inputClassName?: string
}

export function CatalogAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Désignation de la prestation…",
  inputClassName,
}: CatalogAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CatalogSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [noResults, setNoResults] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cacheRef = useRef<Record<string, CatalogSuggestion[]>>({})

  const search = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      setNoResults(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      if (cacheRef.current[q]) {
        const cached = cacheRef.current[q]
        setSuggestions(cached)
        setNoResults(cached.length === 0)
        setOpen(true)
        setActiveIndex(-1)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/catalogue/search?q=${encodeURIComponent(q)}`)
        const data: CatalogSuggestion[] = await res.json()
        cacheRef.current[q] = data
        setSuggestions(data)
        setNoResults(data.length === 0)
        setOpen(true)
        setActiveIndex(-1)
      } catch {
        // ne pas bloquer si la requête échoue
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    search(e.target.value)
  }

  const handleSelect = (item: CatalogSuggestion) => {
    onSelect(item)
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  // Ferme au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={
          inputClassName ??
          "w-full px-2 py-1 text-sm font-medium text-slate-900 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-slate-300"
        }
      />

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[300px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50">
            <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Suggestions du catalogue
            </span>
            {loading && (
              <span className="ml-auto text-[10px] text-slate-400">…</span>
            )}
          </div>

          {noResults ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              Aucune prestation trouvée
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto">
              {suggestions.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    // onMouseDown pour éviter que le blur de l'input ferme le dropdown avant le clic
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(item)
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors min-h-[44px] border-b border-slate-50 last:border-0 ${
                      i === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {item.designation}
                      </div>
                      {item.description && (
                        <div className="text-xs text-slate-400 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right ml-2">
                      <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {item.prixHT.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {UNITE_LABELS[item.unite] ?? item.unite}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
