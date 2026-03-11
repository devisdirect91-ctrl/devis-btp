"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Copy } from "lucide-react"
import { UNITE_LABELS, TVA_TAUX } from "@/lib/devis-utils"
import type { EditorLigne } from "@/lib/devis-utils"

interface LigneRowProps {
  ligne: EditorLigne
  onChange: (id: string, updates: Partial<EditorLigne>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function LigneRow({ ligne, onChange, onDelete, onDuplicate }: LigneRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ligne.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (ligne.ligneType === "SECTION") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 px-1 py-1.5 group"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={ligne.designation}
          onChange={(e) => onChange(ligne.id, { designation: e.target.value })}
          placeholder="Titre de section…"
          className="flex-1 px-2 py-1 text-sm font-semibold text-slate-700 bg-slate-100 border-0 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={() => onDuplicate(ligne.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(ligne.id)}
            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // LINE type
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group border border-slate-100 rounded-xl bg-white hover:border-slate-200 transition-colors"
    >
      {/* Top row: drag + designation + actions */}
      <div className="flex items-start gap-2 px-2 pt-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 flex-shrink-0 mt-0.5"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={ligne.designation}
            onChange={(e) => onChange(ligne.id, { designation: e.target.value })}
            placeholder="Désignation de la prestation…"
            className="w-full px-2 py-1 text-sm font-medium text-slate-900 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-slate-300"
          />
          <input
            type="text"
            value={ligne.description}
            onChange={(e) => onChange(ligne.id, { description: e.target.value })}
            placeholder="Description (optionnel)"
            className="w-full px-2 py-0.5 text-xs text-slate-500 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => onDuplicate(ligne.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(ligne.id)}
            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom row: qty / unite / prix / remise / TVA */}
      <div className="flex items-center gap-2 px-3 pb-2 pl-9">
        {/* Quantité */}
        <div className="flex flex-col min-w-0">
          <label className="text-[10px] text-slate-400 mb-0.5">Qté</label>
          <input
            type="number"
            min="0"
            step="any"
            value={ligne.quantite}
            onChange={(e) => onChange(ligne.id, { quantite: parseFloat(e.target.value) || 0 })}
            className="w-16 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Unité */}
        <div className="flex flex-col min-w-0">
          <label className="text-[10px] text-slate-400 mb-0.5">Unité</label>
          <select
            value={ligne.unite}
            onChange={(e) => onChange(ligne.id, { unite: e.target.value })}
            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {Object.entries(UNITE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Prix unitaire */}
        <div className="flex flex-col min-w-0 flex-1">
          <label className="text-[10px] text-slate-400 mb-0.5">Prix unit. HT</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={ligne.prixUnitaireHT}
              onChange={(e) => onChange(ligne.id, { prixUnitaireHT: parseFloat(e.target.value) || 0 })}
              className="w-full pr-5 pl-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">€</span>
          </div>
        </div>

        {/* Remise */}
        <div className="flex flex-col min-w-0">
          <label className="text-[10px] text-slate-400 mb-0.5">Remise</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={ligne.remise}
              onChange={(e) => onChange(ligne.id, { remise: parseFloat(e.target.value) || 0 })}
              className="w-16 pr-5 pl-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
          </div>
        </div>

        {/* TVA */}
        <div className="flex flex-col min-w-0">
          <label className="text-[10px] text-slate-400 mb-0.5">TVA</label>
          <select
            value={ligne.tauxTva}
            onChange={(e) => onChange(ligne.id, { tauxTva: parseFloat(e.target.value) })}
            className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {TVA_TAUX.map((t) => (
              <option key={t} value={t}>{t} %</option>
            ))}
          </select>
        </div>

        {/* Total HT */}
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-[10px] text-slate-400 mb-0.5">Total HT</span>
          <span className="text-xs font-semibold text-slate-700 py-1 px-2">
            {(ligne.quantite * ligne.prixUnitaireHT * (1 - ligne.remise / 100)).toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
