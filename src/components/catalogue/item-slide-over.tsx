"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { X, Loader2, Save } from "lucide-react"
import { catalogueSchema, type CatalogueFormData } from "@/lib/validations/catalogue"
import { CATEGORY_LABELS, UNITE_LABELS, TVA_RATES } from "@/lib/catalogue-utils"

const CATEGORIES = [
  "PLOMBERIE", "ELECTRICITE", "MACONNERIE", "MENUISERIE", "PEINTURE",
  "CARRELAGE", "CHAUFFAGE", "CLIMATISATION", "COUVERTURE", "ISOLATION",
  "PLATRERIE", "CHARPENTE", "TERRASSEMENT", "VRD", "DEMOLITION",
  "NETTOYAGE", "MAIN_OEUVRE", "FOURNITURES", "AUTRE",
]

const UNITES = [
  "UNITE", "METRE_CARRE", "METRE_LINEAIRE", "METRE", "METRE_CUBE",
  "HEURE", "JOUR", "FORFAIT", "ENSEMBLE", "KILOGRAMME", "TONNE", "LITRE",
]

interface ItemSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  item?: {
    id: string
    reference?: string | null
    category: string
    designation: string
    description?: string | null
    unite: string
    prixHT: number
    tauxTva: number
  } | null
}

export function ItemSlideOver({ isOpen, onClose, onSaved, item }: ItemSlideOverProps) {
  const isEdit = !!item

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CatalogueFormData>({
    defaultValues: {
      reference: "",
      category: "PLOMBERIE",
      designation: "",
      description: "",
      unite: "UNITE",
      prixHT: 0,
      tauxTva: 20,
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        reference: item.reference ?? "",
        category: item.category as any,
        designation: item.designation,
        description: item.description ?? "",
        unite: item.unite as any,
        prixHT: item.prixHT,
        tauxTva: item.tauxTva,
      })
    } else {
      reset({
        reference: "",
        category: "PLOMBERIE",
        designation: "",
        description: "",
        unite: "UNITE",
        prixHT: 0,
        tauxTva: 20,
      })
    }
  }, [item, reset, isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const onSubmit = async (raw: CatalogueFormData) => {
    const data = {
      ...raw,
      prixHT: Number(raw.prixHT),
      tauxTva: Number(raw.tauxTva),
    }

    const parsed = catalogueSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CatalogueFormData
        setError(field, { message: issue.message })
      }
      return
    }

    const url = isEdit ? `/api/catalogue/${item!.id}` : "/api/catalogue"
    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    if (res.ok) {
      onSaved()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? "Modifier la prestation" : "Nouvelle prestation"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Référence + Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Référence interne
              </label>
              <input
                {...register("reference")}
                placeholder="PLO001"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                {...register("category")}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Désignation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Désignation <span className="text-red-500">*</span>
            </label>
            <input
              {...register("designation")}
              placeholder="Ex : Pose robinet mitigeur cuisine"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
                errors.designation
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-200 focus:ring-blue-500"
              }`}
            />
            {errors.designation && (
              <p className="mt-1 text-xs text-red-600">{errors.designation.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description détaillée
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Fourniture et pose, matériaux inclus, mise en service…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Unité + TVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Unité <span className="text-red-500">*</span>
              </label>
              <select
                {...register("unite")}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {UNITES.map((u) => (
                  <option key={u} value={u}>
                    {UNITE_LABELS[u]} — {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                TVA <span className="text-red-500">*</span>
              </label>
              <select
                {...register("tauxTva", { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {TVA_RATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.value} %
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix HT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Prix unitaire HT <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("prixHT", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  errors.prixHT
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                €
              </span>
            </div>
            {errors.prixHT && (
              <p className="mt-1 text-xs text-red-600">{errors.prixHT.message}</p>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? "Enregistrer" : "Ajouter"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
