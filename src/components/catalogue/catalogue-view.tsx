"use client"

import { useState, useMemo, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, Plus, Pencil, Trash2, Loader2, Package,
  ToggleLeft, ToggleRight, Sparkles, X,
} from "lucide-react"
import { ItemSlideOver } from "@/components/catalogue/item-slide-over"
import { ImportExportButtons } from "@/components/catalogue/import-export-buttons"
import {
  CATEGORY_LABELS, CATEGORY_COLORS, UNITE_LABELS,
} from "@/lib/catalogue-utils"

type CatalogItem = {
  id: string
  reference: string | null
  category: string
  designation: string
  description: string | null
  unite: string
  prixHT: number
  tauxTva: number
  actif: boolean
}

interface CatalogueViewProps {
  items: CatalogItem[]
}

export function CatalogueView({ items }: CatalogueViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSeedPending, startSeedTransition] = useTransition()
  const [seedError, setSeedError] = useState<string | null>(null)

  // Categories that actually have items
  const usedCategories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category))
    return Object.keys(CATEGORY_LABELS).filter((c) => cats.has(c))
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === "ALL" || item.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        item.designation.toLowerCase().includes(q) ||
        (item.reference?.toLowerCase().includes(q) ?? false) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      return matchCat && matchSearch
    })
  }, [items, activeCategory, search])

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [filtered])

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleSaved = () => {
    router.refresh()
  }

  const handleToggleActif = useCallback(async (item: CatalogItem) => {
    setTogglingId(item.id)
    await fetch(`/api/catalogue/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !item.actif }),
    })
    setTogglingId(null)
    router.refresh()
  }, [router])

  const handleDelete = useCallback(async (item: CatalogItem) => {
    if (!confirm(`Supprimer "${item.designation}" ? Cette action est irréversible.`)) return
    setDeletingId(item.id)
    await fetch(`/api/catalogue/${item.id}`, { method: "DELETE" })
    setDeletingId(null)
    router.refresh()
  }, [router])

  const handleSeed = () => {
    setSeedError(null)
    startSeedTransition(async () => {
      let res: Response
      try {
        res = await fetch("/api/catalogue/seed", { method: "POST" })
      } catch {
        setSeedError("Impossible de contacter le serveur.")
        return
      }

      let data: { error?: string; created?: number } = {}
      try {
        data = await res.json()
      } catch {
        setSeedError(`Erreur serveur (HTTP ${res.status})`)
        return
      }

      if (!res.ok) {
        setSeedError(data.error ?? `Erreur ${res.status}`)
      } else {
        router.refresh()
      }
    })
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catalogue</h1>
            <p className="text-sm text-slate-500 mt-1">Vos prestations types réutilisables dans les devis</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExportButtons />
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 text-lg">Catalogue vide</p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Ajoutez vos prestations types pour les réutiliser facilement lors de la création de devis.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleSeed}
              disabled={isSeedPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {isSeedPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Pré-remplir avec 29 prestations BTP
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Créer manuellement
            </button>
          </div>
          {seedError && (
            <p className="mt-3 text-sm text-red-600">{seedError}</p>
          )}
        </div>

        <ItemSlideOver
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
          item={editingItem}
        />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} prestation{items.length > 1 ? "s" : ""} · {usedCategories.length} catégorie{usedCategories.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportButtons />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Search + Category tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

        {/* Category tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeCategory === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Tous ({items.length})
          </button>
          {usedCategories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? "ALL" : cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-12 text-center">
          <p className="text-slate-500 text-sm">Aucun résultat pour « {search} »</p>
          <button onClick={() => setSearch("")} className="mt-2 text-sm text-blue-600 hover:underline">
            Effacer la recherche
          </button>
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([category, categoryItems]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  CATEGORY_COLORS[category] || "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className="text-xs text-slate-400">
                {categoryItems.length} prestation{categoryItems.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Réf.</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Désignation</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Unité</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Prix HT</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">TVA</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Actif</th>
                    <th className="text-right px-6 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        {item.reference ? (
                          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.reference}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{item.designation}</p>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {UNITE_LABELS[item.unite] || item.unite}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {item.prixHT.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-500 tabular-nums">{item.tauxTva} %</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActif(item)}
                          disabled={togglingId === item.id}
                          title={item.actif ? "Désactiver" : "Activer"}
                          className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 mx-auto"
                        >
                          {togglingId === item.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : item.actif ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            title="Modifier"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Supprimer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over form */}
      <ItemSlideOver
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingItem(null)
        }}
        onSaved={handleSaved}
        item={editingItem}
      />
    </div>
  )
}
