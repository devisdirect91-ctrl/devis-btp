"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Save, Send, ChevronDown, ChevronUp } from "lucide-react"
import { ClientSelect } from "@/components/devis/client-select"
import { LignesEditor } from "@/components/devis/lignes-editor"
import { CataloguePicker } from "@/components/devis/catalogue-picker"
import { computeDevisTotaux, newLigne, formatEur } from "@/lib/devis-utils"
import type { EditorLigne } from "@/lib/devis-utils"
import { MobileFactureWizard } from "@/components/factures/MobileFactureWizard"

interface FactureEditorProps {
  numero: string
  tauxTvaDefaut: number
  conditionsPaiementDefaut: string
  mentionsLegalesDefaut: string
}

export function FactureEditor({
  numero,
  tauxTvaDefaut,
  conditionsPaiementDefaut,
  mentionsLegalesDefaut,
}: FactureEditorProps) {
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)
  const defaultEcheance = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  // Header
  const [numeroVal, setNumero] = useState(numero)
  const [clientId, setClientId] = useState("")
  const [dateEmission, setDateEmission] = useState(today)
  const [dateEcheance, setDateEcheance] = useState(defaultEcheance)

  // Lines
  const [lignes, setLignes] = useState<EditorLigne[]>([newLigne(tauxTvaDefaut)])

  // Options
  const [conditionsPaiement, setConditionsPaiement] = useState(conditionsPaiementDefaut)
  const [penalitesRetard, setPenalitesRetard] = useState("")
  const [notes, setNotes] = useState("")
  const [mentionsLegales, setMentionsLegales] = useState(mentionsLegalesDefaut)
  const [showOptions, setShowOptions] = useState(false)

  // Acompte reçu (affichage uniquement)
  const [acompteRecu, setAcompteRecu] = useState(0)

  // UI
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totaux = useMemo(
    () => computeDevisTotaux(lignes, 0, "PERCENT", 0, "PERCENT"),
    [lignes]
  )

  const resteAPayer = Math.max(0, totaux.totalTTC - acompteRecu)

  const handleAddFromCatalogue = (ligne: Omit<EditorLigne, "id">) => {
    setLignes((prev) => [...prev, { ...ligne, id: Math.random().toString(36).slice(2) }])
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!clientId) errs.clientId = "Veuillez sélectionner un client"
    if (!numeroVal.trim()) errs.numero = "Numéro requis"
    if (!dateEcheance) errs.dateEcheance = "Date d'échéance requise"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildPayload = () => {
    const condsPaiement = [conditionsPaiement.trim(), penalitesRetard.trim() ? `Pénalités de retard : ${penalitesRetard.trim()}` : ""]
      .filter(Boolean)
      .join("\n\n")

    return {
      numero: numeroVal,
      clientId,
      dateEmission,
      dateEcheance,
      conditionsPaiement: condsPaiement || undefined,
      notes: notes.trim() || undefined,
      mentionsLegales: mentionsLegales.trim() || undefined,
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
        totalHT: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT : 0,
        totalRemise: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (l.remise / 100) : 0,
        totalHtNet: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) : 0,
        totalTva: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (l.tauxTva / 100) : 0,
        totalTTC: l.ligneType === "LINE" ? l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (1 + l.tauxTva / 100) : 0,
      })),
    }
  }

  const save = async (finaliser = false) => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
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
      // Si finaliser, on met à jour le statut
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

  return (
    <>
      {/* ═══════════════ VERSION MOBILE ═══════════════ */}
      <div className="md:hidden min-h-screen">
        <MobileFactureWizard
          numero={numero}
          tauxTvaDefaut={tauxTvaDefaut}
          conditionsPaiementDefaut={conditionsPaiementDefaut}
          mentionsLegalesDefaut={mentionsLegalesDefaut}
        />
      </div>

      {/* ═══════════════ VERSION DESKTOP ═══════════════ */}
      <div className="hidden md:block">
      <CataloguePicker
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        tauxTvaDefaut={tauxTvaDefaut}
        onAdd={handleAddFromCatalogue}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nouvelle facture</h1>
            <p className="text-sm text-slate-500 mt-0.5">Créez une facture indépendante</p>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Finaliser &amp; envoyer
            </button>
          </div>
        </div>

        {errors.global && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errors.global}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identification */}
            <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Identification</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Numéro</label>
                  <input
                    type="text"
                    value={numeroVal}
                    onChange={(e) => setNumero(e.target.value)}
                    className={`w-full px-3 py-2 text-sm text-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
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
                    className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date d&apos;échéance</label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className={`w-full px-3 py-2 text-sm text-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.dateEcheance ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {errors.dateEcheance && <p className="mt-1 text-xs text-red-600">{errors.dateEcheance}</p>}
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

            {/* Options */}
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
                        placeholder="Ex: Virement 30 jours fin de mois"
                        className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Pénalités de retard</label>
                      <input
                        type="text"
                        value={penalitesRetard}
                        onChange={(e) => setPenalitesRetard(e.target.value)}
                        placeholder="Ex: 3× taux légal"
                        className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mentions légales</label>
                    <textarea
                      value={mentionsLegales}
                      onChange={(e) => setMentionsLegales(e.target.value)}
                      placeholder="Mentions légales obligatoires…"
                      rows={4}
                      className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Colonne droite — récapitulatif */}
          <div className="space-y-4">
            <div className="sticky top-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Récapitulatif</h2>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                {/* HT brut + remises lignes */}
                {totaux.totalRemiseLignes > 0 && (
                  <>
                    <TotalRow label="Total HT brut" value={formatEur(totaux.totalHtBrut)} muted />
                    <TotalRow label="Remises lignes" value={`− ${formatEur(totaux.totalRemiseLignes)}`} muted />
                  </>
                )}

                <TotalRow label="Total HT" value={formatEur(totaux.totalHtNet)} />

                {/* TVA */}
                <div className="border-t border-slate-200 pt-3 space-y-1.5">
                  {totaux.tvaDetails.length === 0 ? (
                    <TotalRow label="TVA" value={formatEur(0)} muted />
                  ) : (
                    totaux.tvaDetails.map((t) => (
                      <TotalRow
                        key={t.taux}
                        label={`TVA ${t.taux} % (base ${formatEur(t.base)})`}
                        value={formatEur(t.montant)}
                        muted
                      />
                    ))
                  )}
                </div>

                {/* TTC */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">Total TTC</span>
                    <span className="text-base font-semibold text-slate-900">{formatEur(totaux.totalTTC)}</span>
                  </div>
                </div>

                {/* Acompte déjà versé */}
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-slate-600">Acompte déjà versé</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={acompteRecu || ""}
                        onChange={(e) => setAcompteRecu(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                      <span className="text-xs text-slate-500">€</span>
                    </div>
                  </div>

                  {acompteRecu > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">Reste à payer</span>
                      <span className="text-sm font-semibold text-amber-600">{formatEur(resteAPayer)}</span>
                    </div>
                  )}
                </div>
              </div>

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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Finaliser &amp; envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* fin hidden md:block */}
    </>
  )
}

function TotalRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-slate-500" : "text-slate-700"}`}>{label}</span>
      <span className={`text-sm ${muted ? "text-slate-500" : "font-medium text-slate-900"}`}>{value}</span>
    </div>
  )
}
