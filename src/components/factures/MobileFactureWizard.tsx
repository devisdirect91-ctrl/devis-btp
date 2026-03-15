"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Trash2, Plus, Minus, BookOpen,
  Save, Send, ChevronRight, Layers, FileText, Zap,
} from "lucide-react"
import { ClientSelect } from "@/components/devis/client-select"
import { CatalogAutocomplete } from "@/components/devis/CatalogAutocomplete"
import type { CatalogSuggestion } from "@/components/devis/CatalogAutocomplete"
import { newLigne, newSection, UNITE_LABELS, computeLigne } from "@/lib/devis-utils"
import type { EditorLigne } from "@/lib/devis-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevisSigne {
  id: string
  numero: string
  titre: string | null
  totalTTC: number
  dateEmission: string
  client: {
    id: string
    nom: string
    prenom: string | null
    societe: string | null
    type: string
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileFactureWizardProps {
  numero: string
  tauxTvaDefaut: number
  conditionsPaiementDefaut: string
  mentionsLegalesDefaut: string
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

        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-1 mb-1">
            <input
              type="number"
              min="0"
              step="0.01"
              value={ligne.prixUnitaireHT || ""}
              onChange={(e) => onChange(ligne.id, { prixUnitaireHT: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-20 text-right text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

type WizardMode = "direct" | "devis"

export function MobileFactureWizard({
  numero,
  tauxTvaDefaut,
  conditionsPaiementDefaut,
  mentionsLegalesDefaut,
}: MobileFactureWizardProps) {
  const router = useRouter()

  // ── Mode & step ────────────────────────────────────────────────────────────
  // step 0: mode choice
  // step 1: client (direct) OR devis select (devis mode)
  // step 2: prestations (direct only — skipped in devis mode)
  // step 3: options (dates, conditions, notes, mentions)
  // step 4: récap + create
  const [mode, setMode] = useState<WizardMode>("direct")
  const [step, setStep] = useState(0)
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  // ── Devis signés ───────────────────────────────────────────────────────────
  const [devisList, setDevisList] = useState<DevisSigne[]>([])
  const [loadingDevis, setLoadingDevis] = useState(false)
  const [selectedDevisId, setSelectedDevisId] = useState("")

  // ── Données facture ────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const defaultEcheance = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  const [clientId, setClientId] = useState("")
  const [lignes, setLignes] = useState<EditorLigne[]>([newLigne(tauxTvaDefaut)])
  const [dateEmission, setDateEmission] = useState(today)
  const [dateEcheance, setDateEcheance] = useState(defaultEcheance)
  const [conditionsPaiement, setConditionsPaiement] = useState(conditionsPaiementDefaut)
  const [notes, setNotes] = useState("")
  const [mentionsLegales, setMentionsLegales] = useState(mentionsLegalesDefaut)

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Totaux
  const realLines = lignes.filter((l) => l.ligneType === "LINE")
  const totalHT = realLines.reduce(
    (s, l) => s + l.quantite * l.prixUnitaireHT * (1 - l.remise / 100),
    0
  )
  const totalTVA = realLines.reduce(
    (s, l) => s + l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (l.tauxTva / 100),
    0
  )
  const totalTTC = totalHT + totalTVA

  // ── Chargement des devis signés ────────────────────────────────────────────
  useEffect(() => {
    if (mode === "devis" && step === 1 && devisList.length === 0) {
      setLoadingDevis(true)
      fetch("/api/devis?status=SIGNE&limit=50")
        .then((r) => r.json())
        .then((data) => setDevisList(data.devis ?? []))
        .finally(() => setLoadingDevis(false))
    }
  }, [mode, step, devisList.length])

  // ── Chargement du devis sélectionné ───────────────────────────────────────
  const handleSelectDevis = async (devisId: string) => {
    setSelectedDevisId(devisId)
    try {
      const res = await fetch(`/api/devis/${devisId}`)
      const data = await res.json()
      const devis = data.devis
      if (!devis) return

      setClientId(devis.client?.id ?? "")
      if (devis.lignes && devis.lignes.length > 0) {
        setLignes(
          devis.lignes.map((l: any) => ({
            id: Math.random().toString(36).slice(2),
            ligneType: l.ligneType,
            designation: l.designation,
            description: l.description ?? "",
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaireHT: l.prixUnitaireHT,
            remise: l.remise,
            tauxTva: l.tauxTva,
            catalogItemId: l.catalogItemId ?? undefined,
          }))
        )
      }
      // Saute les étapes client + lignes
      setStep(3)
    } catch {
      setStepErrors({ devisId: "Impossible de charger ce devis" })
    }
  }

  // ── Gestion des lignes ─────────────────────────────────────────────────────
  const handleLigneChange = (id: string, updates: Partial<EditorLigne>) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }

  const handleLigneDelete = (id: string) => {
    setLignes((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  const validateStep = () => {
    const errs: Record<string, string> = {}
    if (step === 1 && mode === "direct" && !clientId) {
      errs.clientId = "Veuillez sélectionner un client"
    }
    if (step === 2 && realLines.length === 0) {
      errs.lignes = "Ajoutez au moins une prestation"
    }
    setStepErrors(errs)
    return Object.keys(errs).length === 0
  }

  const getNextStep = () => {
    if (step === 1 && mode === "devis") return 3 // devis flow: skip client + lignes
    if (step === 1 && mode === "direct") return 2
    return step + 1
  }

  const getPrevStep = () => {
    if (step === 3 && mode === "devis") return 1
    if (step === 0) return -1
    return step - 1
  }

  const goNext = () => {
    if (validateStep()) setStep(getNextStep())
  }

  const goBack = () => {
    const prev = getPrevStep()
    if (prev === -1) router.back()
    else setStep(prev)
  }

  const chooseMode = (m: WizardMode) => {
    setMode(m)
    if (m === "direct") {
      setLignes([newLigne(tauxTvaDefaut)])
    }
    setStep(1)
  }

  // Nombre d'étapes visibles selon le mode
  const totalSteps = mode === "devis" ? 3 : 4 // (1 devis/client + lignes? + options + recap)
  const displayStep = mode === "devis"
    ? step === 1 ? 1 : step === 3 ? 2 : step === 4 ? 3 : step
    : step

  // ── Soumission ─────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    numero,
    clientId,
    dateEmission,
    dateEcheance,
    conditionsPaiement: conditionsPaiement.trim() || undefined,
    notes: notes.trim() || undefined,
    mentionsLegales: mentionsLegales.trim() || undefined,
    lignes: lignes.map((l, idx) => {
      if (l.ligneType === "SECTION") {
        return {
          ligneType: "SECTION" as const,
          ordre: idx,
          designation: l.designation,
          description: l.description,
          quantite: 0,
          unite: l.unite,
          prixUnitaireHT: 0,
          remise: 0,
          tauxTva: 0,
          totalHT: 0,
          totalRemise: 0,
          totalHtNet: 0,
          totalTva: 0,
          totalTTC: 0,
        }
      }
      const totals = computeLigne(l.quantite, l.prixUnitaireHT, l.remise, l.tauxTva)
      return {
        ligneType: "LINE" as const,
        ordre: idx,
        designation: l.designation,
        description: l.description,
        quantite: l.quantite,
        unite: l.unite,
        prixUnitaireHT: l.prixUnitaireHT,
        remise: l.remise,
        tauxTva: l.tauxTva,
        ...totals,
      }
    }),
  })

  const handleSave = async (finaliser: boolean) => {
    if (!clientId) {
      setErrors({ global: "Client manquant" })
      return
    }
    setIsSaving(true)
    setErrors({})
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error ?? data.issues?.[0]?.message ?? "Erreur lors de la création"
        setErrors({ global: msg })
        return
      }
      if (finaliser) {
        await fetch(`/api/factures/${data.facture.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "EN_ATTENTE" }),
        })
      }
      router.push(`/factures/${data.facture.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-slate-50 min-h-full">

      {/* Barre de progression */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={goBack}
            className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {step > 0 && (
            <span className="text-sm font-medium text-slate-400">
              Étape {displayStep}/{totalSteps}
            </span>
          )}
          <div className="w-9" />
        </div>
        {step > 0 && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 px-4 pt-6 pb-4">

        {/* ÉTAPE 0 — CHOIX DU MODE */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nouvelle facture</h2>
              <p className="text-sm text-slate-500 mt-1">Comment souhaitez-vous créer cette facture ?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => chooseMode("devis")}
                className="w-full flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl active:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">Depuis un devis signé</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Importez les prestations d&apos;un devis accepté
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
              </button>

              <button
                onClick={() => chooseMode("direct")}
                className="w-full flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl active:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">Facture directe</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Créez une facture indépendante de zéro
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 — CLIENT (direct) OU DEVIS (devis mode) */}
        {step === 1 && mode === "direct" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pour quel client ?</h2>
              <p className="text-sm text-slate-500 mt-1">Sélectionnez ou créez un client</p>
            </div>
            <ClientSelect
              value={clientId}
              onChange={setClientId}
              error={stepErrors.clientId}
            />
          </div>
        )}

        {step === 1 && mode === "devis" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quel devis ?</h2>
              <p className="text-sm text-slate-500 mt-1">Choisissez un devis signé à facturer</p>
            </div>

            {stepErrors.devisId && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {stepErrors.devisId}
              </div>
            )}

            {loadingDevis ? (
              <div className="py-12 text-center text-sm text-slate-400">Chargement…</div>
            ) : devisList.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Aucun devis signé disponible</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devisList.map((d) => {
                  const clientName = d.client.societe || `${d.client.prenom ?? ""} ${d.client.nom}`.trim()
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDevis(d.id)}
                      className={`w-full text-left p-4 bg-white border rounded-2xl active:bg-blue-50 transition-colors ${
                        selectedDevisId === d.id ? "border-blue-400" : "border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{clientName}</p>
                        <span className="text-sm font-bold text-blue-600 tabular-nums flex-shrink-0">
                          {fmt(d.totalTTC)}
                        </span>
                      </div>
                      {d.titre && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{d.titre}</p>
                      )}
                      <p className="text-xs text-slate-400 font-mono mt-1">{d.numero}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2 — PRESTATIONS (direct uniquement) */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quelles prestations ?</h2>
              <p className="text-sm text-slate-500 mt-1">Détaillez les lignes de votre facture</p>
            </div>

            {stepErrors.lignes && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {stepErrors.lignes}
              </div>
            )}

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
                onClick={() => setLignes((prev) => [...prev, newLigne(tauxTvaDefaut)])}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 active:bg-slate-50 rounded-2xl transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-500" />
                Ajouter
              </button>
              <button
                onClick={() => setLignes((prev) => [...prev, newSection()])}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 active:bg-slate-50 rounded-2xl transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                Section
              </button>
              <button
                onClick={() => {/* catalogue via autocomplete */}}
                className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-blue-700 bg-blue-50 active:bg-blue-100 rounded-2xl transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Catalogue
              </button>
            </div>

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

        {/* ÉTAPE 3 — OPTIONS */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dates &amp; options</h2>
              <p className="text-sm text-slate-500 mt-1">Complétez les informations de la facture</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Émission</label>
                <input
                  type="date"
                  value={dateEmission}
                  onChange={(e) => setDateEmission(e.target.value)}
                  className="w-full px-3 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Échéance</label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className="w-full px-3 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Conditions de paiement</label>
              <input
                type="text"
                value={conditionsPaiement}
                onChange={(e) => setConditionsPaiement(e.target.value)}
                placeholder="Ex : Virement 30 jours fin de mois"
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques ou informations complémentaires…"
                rows={3}
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mentions légales (optionnel)</label>
              <textarea
                value={mentionsLegales}
                onChange={(e) => setMentionsLegales(e.target.value)}
                placeholder="Mentions légales obligatoires…"
                rows={3}
                className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 4 — RÉCAPITULATIF */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Votre facture est prête !</h2>
              <p className="text-sm text-slate-500 mt-1">Vérifiez et créez la facture</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Numéro</span>
                <span className="font-mono font-semibold text-slate-900">{numero}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Émission</span>
                <span className="font-medium text-slate-900">
                  {new Date(dateEmission).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Échéance</span>
                <span className="font-medium text-slate-900">
                  {new Date(dateEcheance).toLocaleDateString("fr-FR")}
                </span>
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
                  {totalHT.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">TVA</span>
                <span className="tabular-nums text-slate-900">
                  {totalTVA.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total TTC</span>
                <span className="text-lg font-bold text-blue-600 tabular-nums">
                  {totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
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

        <div className="h-36" />
      </div>

      {/* Boutons fixes en bas */}
      {step > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-20 bg-white border-t border-slate-100 px-4 py-3">
          {step < 4 ? (
            <button
              onClick={goNext}
              className="w-full h-12 bg-blue-500 active:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="w-full h-12 bg-blue-500 active:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                {isSaving ? "Création…" : "Créer &amp; finaliser"}
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="w-full h-12 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 active:bg-slate-50 text-sm"
              >
                <Save className="w-4 h-4" />
                Brouillon
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
