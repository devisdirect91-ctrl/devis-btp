"use client"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { Plus, BookOpen, Layers } from "lucide-react"
import { LigneRow } from "./ligne-row"
import { newLigne, newSection } from "@/lib/devis-utils"
import type { EditorLigne } from "@/lib/devis-utils"

interface LignesEditorProps {
  lignes: EditorLigne[]
  tauxTvaDefaut: number
  onChange: (lignes: EditorLigne[]) => void
  onOpenCatalogue: () => void
}

export function LignesEditor({ lignes, tauxTvaDefaut, onChange, onOpenCatalogue }: LignesEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = lignes.findIndex((l) => l.id === active.id)
      const newIndex = lignes.findIndex((l) => l.id === over.id)
      onChange(arrayMove(lignes, oldIndex, newIndex))
    }
  }

  const handleChange = (id: string, updates: Partial<EditorLigne>) => {
    onChange(lignes.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }

  const handleDelete = (id: string) => {
    onChange(lignes.filter((l) => l.id !== id))
  }

  const handleDuplicate = (id: string) => {
    const idx = lignes.findIndex((l) => l.id === id)
    if (idx === -1) return
    const copy = { ...lignes[idx], id: Math.random().toString(36).slice(2) }
    const next = [...lignes]
    next.splice(idx + 1, 0, copy)
    onChange(next)
  }

  return (
    <div className="space-y-1">
      {lignes.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          Aucune ligne — ajoutez une prestation ci-dessous
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lignes.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {lignes.map((ligne) => (
                <LigneRow
                  key={ligne.id}
                  ligne={ligne}
                  onChange={handleChange}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <button
          type="button"
          onClick={() => onChange([...lignes, newLigne(tauxTvaDefaut)])}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter une ligne
        </button>
        <button
          type="button"
          onClick={() => onChange([...lignes, newSection()])}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          Ajouter une section
        </button>
        <button
          type="button"
          onClick={onOpenCatalogue}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Depuis le catalogue
        </button>
      </div>
    </div>
  )
}
