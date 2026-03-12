"use client"

import { useState } from "react"
import {
  ArrowLeft, Trash2, Plus, Minus, BookOpen,
  Save, Send, ChevronRight, Layers,
} from "lucide-react"
import { ClientSelect } from "./client-select"
import { CatalogAutocomplete } from "./CatalogAutocomplete"
import type { CatalogSuggestion } from "./CatalogAutocomplete"
import { newLigne, newSection, UNITE_LABELS } from "@/lib/devis-utils"
import type { EditorLigne, DevisTotaux } from "@/lib/devis-utils"

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileDevisWizardProps {
  editId?: string
  numero: string
  // Step 1 — Client
  clientId: string
  onClientChange: (id: string) => void
  // Step 2 — Prestations
  lignes: EditorLigne[]
  onLignesChange: (lignes: EditorLigne[]) => void
  tauxTvaDefaut: number
  onOpenCatalogue: () => void
  // Step 3 — Informations
  titre: string
  onTitreChange: (v: string) => void
  dateEmission: string
  onDateEmissionChange: (v: string) => void
  validiteJours: number
  onValiditeJoursChange: (v: number) => void
  adresseChantier: string
  onAdresseChantierChange: (v: string) => void
  notes: string
  onNotesChange: (v: string) => void
  conditionsPaiement: string
  onConditionsPaiementChange: (v: string) => void
  // Step 4 — Finalisation
  totaux: DevisTotaux
  isSaving: boolean
  errors: Record<string, string>
  onSave: (sendAfter: boolean) => void
  onBack: () => void
}

// ─── Mobile ligne card ────────────────────────────────────────────────────────

function MobileLigneCard({
  ligne,
  onChange,
  onDelete,
}: {
  ligne: EditorLigne
  onChange: (id: string, updates: Partial<EditorLigne>) => void
  onDelete: (id: string) => void
}) {
  const total = ligne.quantite * ligne.prixUnitaireHT * (1 - ligne.remise / 100)

  const handleCatalogSelect = (item: CatalogSuggestion) => {
    onChange(ligne.id, {
      designation: item.designation,
      description: item.description ?? "",
      prixUnitaireHT: item.prixHT,
      unite: item.unite,
      tauxTva: item.tauxTva,
      catalogItemId: item.id,
    })
  }

  if (ligne.ligneType === "SECTION") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200">
        <input
          type="text"
          value={ligne.designation}
          onChange={(e) => onChange(ligne.id, { designation: e.target.value })}
          placeholder="Titre de section…"
          className="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-0 focus:outline-none"
        />
        <button
          onClick={() => onDelete(ligne.id)}
          className="p-1.5 text-slate-300 active:text-red-500 rounded-lg flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      {/* Désignation + supprimer */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <CatalogAutocomplete
            value={ligne.designation}
            onChange={(val) => onChange(ligne.id, { designation: val })}
            onSelect={handleCatalogSelect}
          />
          <input
            type="text"
            value={ligne.description}
            onChange={(e) => onChange(ligne.id, { description: e.target.value })}
            placeholder="Description (optionnel)"
            className="w-full text-sm text-slate-400 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-slate-300 mt-1"
          />
        </div>
        <button
          onClick={() => onDelete(ligne.id)}
          className="p-1.5 text-slate-300 active:text-red-500 rounded-lg flex-shrink-0 mt-0.5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t border-slate-100 my-3" />

      {/* Qté + prix */}
      <div className="flex items-center gap-3">
        {/* − qté + */}
        <button
          onClick={() => onChange(ligne.id, { quantite: Math.max(0.25, +(ligne.quantite - 1).toFixed(2)) })}
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 active:bg-slate-100 flex-shrink-0"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 min-w-0">
          <input
            type="number"
            min="0"
            step="any"
            value={ligne.quantite}
            onChange={(e) => onChange(ligne.id, { quantite: parseFloat(e.target.value) || 0 })}
            className="w-12 text-center font-semibold text-slate-900 border-0 focus:outline-none bg-transparent"
          />
          <select
            value={ligne.unite}
            onChange={(e) => onChange(ligne.id, { unite: e.target.value })}
            className="text-xs text-slate-500 border-0 bg-transparent focus:outline-none"
          >
            {Object.entries(UNITE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onChange(ligne.id, { quantite: +(ligne.quantite + 1).toFixed(2) })}
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 active:bg-slate-100 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Prix u. + total */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-1 mb-1">
            <input
              type="number"
              min="0"
              step="0.01"
              value={ligne.prixUnitaireHT || ""}
              onChange={(e) => onChange(ligne.id, { prixUnitaireHT: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-20 text-right text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <span className="text-xs text-slate-400 flex-shrink-0">€/u</span>
          </div>
          <p className="text-base font-bold text-slate-900 tabular-nums">
            {total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4

export function MobileDevisWizard({
  editId,
  numero,
  clientId,
  onClientChange,
  lignes,
  onLignesChange,
  tauxTvaDefaut,
  onOpenCatalogue,
  titre,
  onTitreChange,
  dateEmission,
  onDateEmissionChange,
  validiteJours,
  onValiditeJoursChange,
  adresseChantier,
  onAdresseChantierChange,
  notes,
  onNotesChange,
  conditionsPaiement,
  onConditionsPaiementChange,
  totaux,
  isSaving,
  errors,
  onSave,
  onBack,
}: MobileDevisWizardProps) {
  const [step, setStep] = useState(1)
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  const handleLigneChange = (id: string, updates: Partial<EditorLigne>) => {
    onLignesChange(lignes.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }

  const handleLigneDelete = (id: string) => {
    onLignesChange(lignes.filter((l) => l.id !== id))
  }

  const validateStep = () => {
    const errs: Record<string, string> = {}
    if (step === 1 && !clientId) errs.clientId = "Veuillez sélectionner un client"
    if (step === 3 && !titre.trim()) errs.titre = "Le titre est requis"
    setStepErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    if (step === 1) onBack()
    else setStep((s) => s - 1)
  }

  const realLines = lignes.filter((l) => l.ligneType === "LINE")
  const totalHT = realLines.reduce(
    (s, l) => s + l.quantite * l.prixUnitaireHT * (1 - l.remise / 100),
    0
  )

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      {/* ── Barre de progression ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={goBack}
            className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-400">
            Étape {step}/{TOTAL_STEPS}
          </span>
          <div className="w-9" />
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-amber-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Contenu des étapes ───────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-6 pb-4">

        {/* ÉTAPE 1 — CLIENT */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pour quel client ?</h2>
              <p className="text-sm text-slate-500 mt-1">Sélectionnez ou créez un client</p>
            </div>
            <ClientSelect
              value={clientId}
              onChange={onClientChange}
              error={stepErrors.clientId}
            />
          </div>
        )}

        {/* ÉTAPE 2 — PRESTATIONS */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quels travaux ?</h2>
              <p className="text-sm text-slate-500 mt-1">Ajoutez vos prestations</p>
            </div>

            {lignes.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm text-slate-400">Aucune prestation — ajoutez-en une ci-dessous</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lignes.map((l) => (
                  <MobileLigneCard
                    key={l.id}
                    ligne={l}
                    onChange={handleLigneChange}
                    onDelete={handleLigneDelete}
                  />
                ))}
              </div>
            )}

            {/* Boutons d'ajout */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onLignesChange([...lignes, newLigne(tauxTvaDefaut)])}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 active:bg-slate-50 rounded-2xl transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-500" />
                Ajouter
              </button>
              <button
                onClick={() => onLignesChange([...lignes, newSection()])}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 active:bg-slate-50 rounded-2xl transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                Section
              </button>
              <button
                onClick={onOpenCatalogue}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-amber-700 bg-amber-50 active:bg-amber-100 rounded-2xl transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Catalogue
              </button>
            </div>

            {/* Total courant */}
            {totalHT > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-slate-500">Total HT</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {totalHT.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 3 — INFORMATIONS */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quelques détails</h2>
              <p className="text-sm text-slate-500 mt-1">Complétez les informations du devis</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Titre du devis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => onTitreChange(e.target.value)}
                placeholder="Ex : Rénovation salle de bain — M. Dupont"
                className={`w-full px-4 py-3 text-sm text-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
                  stepErrors.titre ? "border-red-300" : "border-slate-200"
                }`}
              />
              {stepErrors.titre && (
                <p className="mt-1 text-xs text-red-600">{stepErrors.titre}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Émission</label>
                <input
                  type="date"
                  value={dateEmission}
                  onChange={(e) => onDateEmissionChange(e.target.value)}
                  className="w-full px-3 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Validité (j.)</label>
                <input
                  type="number"
                  min="1"
                  value={validiteJours}
                  onChange={(e) => onValiditeJoursChange(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse chantier</label>
              <input
                type="text"
                value={adresseChantier}
                onChange={(e) => onAdresseChantierChange(e.target.value)}
                placeholder="Adresse du chantier (optionnel)"
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Conditions de paiement</label>
              <input
                type="text"
                value={conditionsPaiement}
                onChange={(e) => onConditionsPaiementChange(e.target.value)}
                placeholder="Ex : 30% à la commande, solde à la livraison"
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Remarques ou informations complémentaires…"
                rows={3}
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 4 — RÉCAPITULATIF */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editId ? "Modifications prêtes" : "Votre devis est prêt !"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Vérifiez et enregistrez</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Numéro</span>
                <span className="font-mono font-semibold text-slate-900">{numero}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Titre</span>
                <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">{titre || "—"}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Prestations</span>
                <span className="font-medium text-slate-900">
                  {realLines.length} ligne{realLines.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Total HT</span>
                <span className="tabular-nums text-slate-900">
                  {totaux.totalHtNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">TVA</span>
                <span className="tabular-nums text-slate-900">
                  {totaux.totalTva.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total TTC</span>
                <span className="text-lg font-bold text-amber-600 tabular-nums">
                  {totaux.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            </div>

            {errors.global && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {errors.global}
              </div>
            )}
          </div>
        )}

        {/* Spacer pour les boutons fixes en bas */}
        <div className="h-36" />
      </div>

      {/* ── Boutons fixes en bas ─────────────────────────────────────────── */}
      <div className="fixed bottom-14 left-0 right-0 z-20 bg-white border-t border-slate-100 px-4 py-3">
        {step < TOTAL_STEPS ? (
          <button
            onClick={goNext}
            className="w-full h-12 bg-amber-500 active:bg-amber-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Continuer
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onSave(true)}
              disabled={isSaving}
              className="w-full h-12 bg-amber-500 active:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              Enregistrer &amp; envoyer
            </button>
            <button
              onClick={() => onSave(false)}
              disabled={isSaving}
              className="w-full h-12 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 active:bg-slate-50 text-sm"
            >
              <Save className="w-4 h-4" />
              Brouillon
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
