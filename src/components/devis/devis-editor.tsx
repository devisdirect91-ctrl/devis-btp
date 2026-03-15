"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Save, Send, ChevronDown, ChevronUp } from "lucide-react"
import { ClientSelect } from "./client-select"
import { LignesEditor } from "./lignes-editor"
import { DevisTotals } from "./devis-totals"
import { CataloguePicker } from "./catalogue-picker"
import { MobileDevisWizard } from "./MobileDevisWizard"
import { computeDevisTotaux, newLigne } from "@/lib/devis-utils"
import type { EditorLigne } from "@/lib/devis-utils"

export interface DevisInitialData {
  titre: string
  clientId: string
  dateEmission: string
  validiteJours: number
  adresseChantier: string
  objetTravaux: string
  dateDebutPrevisionnel: string
  remiseGlobale: number
  remiseGlobaleType: "PERCENT" | "AMOUNT"
  acompte: number
  acompteType: "PERCENT" | "AMOUNT"
  conditionsPaiement: string
  delaiExecution: string
  notes: string
  mentionsLegales: string
  lignes: EditorLigne[]
}

interface DevisEditorProps {
  numero: string
  tauxTvaDefaut: number
  conditionsPaiementDefaut: string
  mentionsLegalesDefaut: string
  editId?: string
  initialData?: DevisInitialData
}

export function DevisEditor({
  numero,
  tauxTvaDefaut,
  conditionsPaiementDefaut,
  mentionsLegalesDefaut,
  editId,
  initialData,
}: DevisEditorProps) {
  const router = useRouter()

  // Header fields
  const [numeroVal, setNumero] = useState(numero)
  const [titre, setTitre] = useState(initialData?.titre ?? "")
  const [clientId, setClientId] = useState(initialData?.clientId ?? "")
  const [dateEmission, setDateEmission] = useState(initialData?.dateEmission ?? new Date().toISOString().slice(0, 10))
  const [validiteJours, setValiditeJours] = useState(initialData?.validiteJours ?? 30)

  // Chantier
  const [adresseChantier, setAdresseChantier] = useState(initialData?.adresseChantier ?? "")
  const [objetTravaux, setObjetTravaux] = useState(initialData?.objetTravaux ?? "")
  const [dateDebutPrevisionnel, setDateDebutPrevisionnel] = useState(initialData?.dateDebutPrevisionnel ?? "")

  // Lines
  const [lignes, setLignes] = useState<EditorLigne[]>(initialData?.lignes ?? [newLigne(tauxTvaDefaut)])

  // Totals controls
  const [remiseGlobale, setRemiseGlobale] = useState(initialData?.remiseGlobale ?? 0)
  const [remiseGlobaleType, setRemiseGlobaleType] = useState<"PERCENT" | "AMOUNT">(initialData?.remiseGlobaleType ?? "PERCENT")
  const [acompte, setAcompte] = useState(initialData?.acompte ?? 0)
  const [acompteType, setAcompteType] = useState<"PERCENT" | "AMOUNT">(initialData?.acompteType ?? "PERCENT")

  // Options
  const [conditionsPaiement, setConditionsPaiement] = useState(initialData?.conditionsPaiement ?? conditionsPaiementDefaut)
  const [delaiExecution, setDelaiExecution] = useState(initialData?.delaiExecution ?? "")
  const [notes, setNotes] = useState(initialData?.notes ?? "")
  const [mentionsLegales, setMentionsLegales] = useState(initialData?.mentionsLegales ?? mentionsLegalesDefaut)
  const [showOptions, setShowOptions] = useState(false)

  // UI state
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totaux = useMemo(
    () => computeDevisTotaux(lignes, remiseGlobale, remiseGlobaleType, acompte, acompteType),
    [lignes, remiseGlobale, remiseGlobaleType, acompte, acompteType]
  )

  const handleAddFromCatalogue = (ligne: Omit<EditorLigne, "id">) => {
    setLignes((prev) => [...prev, { ...ligne, id: Math.random().toString(36).slice(2) }])
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!clientId) errs.clientId = "Veuillez sélectionner un client"
    if (!numeroVal.trim()) errs.numero = "Numéro requis"
    if (!titre.trim()) errs.titre = "Le titre est requis"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildPayload = (status?: string) => ({
    numero: numeroVal,
    titre: titre.trim(),
    clientId,
    dateEmission,
    validiteJours,
    adresseChantier: adresseChantier.trim(),
    objetTravaux: objetTravaux.trim(),
    dateDebutPrevisionnel: dateDebutPrevisionnel || undefined,
    remiseGlobale,
    remiseGlobaleType,
    acompte,
    acompteType,
    conditionsPaiement: conditionsPaiement.trim(),
    delaiExecution: delaiExecution.trim(),
    notes: notes.trim(),
    mentionsLegales: mentionsLegales.trim(),
    lignes: lignes.map((l, idx) => ({
      ligneType: l.ligneType,
      ordre: idx,
      designation: l.designation,
      description: l.description,
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaireHT: l.prixUnitaireHT,
      remise: l.remise,
      tauxTva: l.tauxTva,
      catalogItemId: l.catalogItemId || undefined,
      totalHT: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT : 0,
      totalRemise: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (l.remise / 100) : 0,
      totalHtNet: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) : 0,
      totalTva: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (l.tauxTva / 100) : 0,
      totalTTC: l.ligneType === "LINE"
        ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (1 + l.tauxTva / 100)
        : 0,
    })),
    ...(status ? { status } : {}),
  })

  const save = async (sendAfter = false) => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const url = editId ? `/api/devis/${editId}` : "/api/devis"
      const method = editId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("EN_ATTENTE")),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.issues) {
          const e: Record<string, string> = {}
          for (const issue of data.issues) e[issue.path?.[0] ?? "global"] = issue.message
          setErrors(e)
        } else {
          setErrors({ global: data.error ?? "Erreur lors de la sauvegarde" })
        }
        return
      }
      router.push(`/devis/${editId ?? data.devis.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <CataloguePicker
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        tauxTvaDefaut={tauxTvaDefaut}
        onAdd={handleAddFromCatalogue}
      />

      {/* Mobile wizard */}
      <div className="md:hidden">
        <MobileDevisWizard
          editId={editId}
          numero={numeroVal}
          clientId={clientId}
          onClientChange={setClientId}
          lignes={lignes}
          onLignesChange={setLignes}
          tauxTvaDefaut={tauxTvaDefaut}
          onOpenCatalogue={() => setIsCatalogueOpen(true)}
          titre={titre}
          onTitreChange={setTitre}
          dateEmission={dateEmission}
          onDateEmissionChange={setDateEmission}
          validiteJours={validiteJours}
          onValiditeJoursChange={setValiditeJours}
          adresseChantier={adresseChantier}
          onAdresseChantierChange={setAdresseChantier}
          notes={notes}
          onNotesChange={setNotes}
          conditionsPaiement={conditionsPaiement}
          onConditionsPaiementChange={setConditionsPaiement}
          totaux={totaux}
          isSaving={isSaving}
          errors={errors}
          onSave={save}
          onBack={() => router.back()}
        />
      </div>

      {/* Desktop form */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{editId ? "Modifier le devis" : "Nouveau devis"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{editId ? `Modification du devis ${numeroVal}` : "Créez et configurez votre devis"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Enregistrer brouillon
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Enregistrer &amp; envoyer
            </button>
          </div>
        </div>

        {errors.global && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errors.global}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identité du devis */}
            <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Identification</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Numéro</label>
                  <input
                    type="text"
                    value={numeroVal}
                    onChange={(e) => setNumero(e.target.value)}
                    className={`w-full px-3 py-2 text-sm text-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.numero ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {errors.numero && <p className="mt-1 text-xs text-red-600">{errors.numero}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date d&apos;émission</label>
                  <input
                    type="date"
                    value={dateEmission}
                    onChange={(e) => setDateEmission(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titre / objet du devis</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Rénovation salle de bain — M. Dupont"
                  className={`w-full px-3 py-2 text-sm text-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.titre ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {errors.titre && <p className="mt-1 text-xs text-red-600">{errors.titre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Validité (jours)</label>
                  <input
                    type="number"
                    min="1"
                    value={validiteJours}
                    onChange={(e) => setValiditeJours(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Client */}
            <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Client</h2>
              <ClientSelect
                value={clientId}
                onChange={setClientId}
                error={errors.clientId}
              />
            </section>

            {/* Lignes */}
            <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Prestations</h2>
              <LignesEditor
                lignes={lignes}
                tauxTvaDefaut={tauxTvaDefaut}
                onChange={setLignes}
                onOpenCatalogue={() => setIsCatalogueOpen(true)}
              />
            </section>

            {/* Options (collapsible) */}
            <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Options &amp; mentions</h2>
                {showOptions ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showOptions && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Conditions de paiement</label>
                      <input
                        type="text"
                        value={conditionsPaiement}
                        onChange={(e) => setConditionsPaiement(e.target.value)}
                        placeholder="Ex: 30% à la commande, solde à la livraison"
                        className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Délai d&apos;exécution</label>
                      <input
                        type="text"
                        value={delaiExecution}
                        onChange={(e) => setDelaiExecution(e.target.value)}
                        placeholder="Ex: 3 semaines"
                        className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Remarques, informations complémentaires…"
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mentions légales</label>
                    <textarea
                      value={mentionsLegales}
                      onChange={(e) => setMentionsLegales(e.target.value)}
                      placeholder="Mentions légales obligatoires…"
                      rows={4}
                      className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right column — totals */}
          <div className="space-y-4">
            <div className="sticky top-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Récapitulatif</h2>
              <DevisTotals
                totaux={totaux}
                remiseGlobale={remiseGlobale}
                remiseGlobaleType={remiseGlobaleType}
                acompte={acompte}
                acompteType={acompteType}
                onRemiseGlobaleChange={setRemiseGlobale}
                onRemiseGlobaleTypeChange={setRemiseGlobaleType}
                onAcompteChange={setAcompte}
                onAcompteTypeChange={setAcompteType}
              />

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Brouillon
                </button>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Enregistrer &amp; envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
