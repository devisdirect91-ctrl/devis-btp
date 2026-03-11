"use client"

import { useState, useEffect } from "react"
import { Search, X, Plus } from "lucide-react"
import { CATEGORY_LABELS, UNITE_LABELS } from "@/lib/catalogue-utils"
import type { EditorLigne } from "@/lib/devis-utils"

type CatalogItem = {
  id: string
  category: string
  reference?: string | null
  designation: string
  description?: string | null
  unite: string
  prixHT: number
  tauxTva: number
}

interface CataloguePickerProps {
  isOpen: boolean
  onClose: () => void
  tauxTvaDefaut: number
  onAdd: (ligne: Omit<EditorLigne, "id">) => void
}

export function CataloguePicker({ isOpen, onClose, tauxTvaDefaut, onAdd }: CataloguePickerProps) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    fetch("/api/catalogue?actif=true&limit=500")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const usedCategories = [...new Set(items.map((i) => i.category))].sort()

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === "ALL" || item.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || item.designation.toLowerCase().includes(q) || item.reference?.toLowerCase().includes(q) || false
    return matchCat && matchSearch
  })

  const handleAdd = (item: CatalogItem) => {
    onAdd({
      ligneType: "LINE",
      designation: item.designation,
      description: item.description ?? "",
      quantite: 1,
      unite: item.unite,
      prixUnitaireHT: item.prixHT,
      remise: 0,
      tauxTva: item.tauxTva,
      catalogItemId: item.id,
    })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[680px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Ajouter depuis le catalogue</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une prestation…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
              activeCategory === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Tous
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? "ALL" : cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                activeCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">Aucune prestation trouvée</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 group cursor-default"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.reference && (
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.reference}
                        </span>
                      )}
                      <p className="text-sm font-medium text-slate-900 truncate">{item.designation}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{UNITE_LABELS[item.unite] || item.unite}</span>
                      <span className="font-semibold text-slate-600">
                        {item.prixHT.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                      <span>TVA {item.tauxTva} %</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
