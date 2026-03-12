"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye, FileDown, Mail, Trash2, MoreHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle,
  Receipt, X, AlertCircle, Loader2, Plus,
} from "lucide-react"
import { clientDisplayName } from "@/lib/client-utils"
import { FACTURE_STATUS_LABELS, FACTURE_STATUS_STYLES, computeFactureStatus } from "@/lib/facture-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientRow = {
  id: string
  nom: string
  prenom?: string | null
  societe?: string | null
  type: string
  email?: string | null
}

export type FactureRow = {
  id: string
  numero: string
  status: string
  dateEmission: Date
  dateEcheance: Date
  datePaiement?: Date | null
  dateEnvoi?: Date | null
  totalTTC: number
  totalHT: number
  montantPaye: number
  modePaiement?: string | null
  client: ClientRow
  devis?: { id: string; numero: string } | null
  consulted?: boolean
}

type SortKey = "numero" | "client" | "dateEmission" | "dateEcheance" | "totalTTC" | "status"

// ─── Paiement modal ───────────────────────────────────────────────────────────

const MODES = ["Virement", "Chèque", "CB", "Espèces", "Autre"]

function PaiementModal({
  facture,
  onClose,
  onSaved,
}: {
  facture: FactureRow
  onClose: () => void
  onSaved: () => void
}) {
  const restant = facture.totalTTC - facture.montantPaye
  const today = new Date().toISOString().slice(0, 10)
  const [montant, setMontant] = useState(String(Math.round(restant * 100) / 100))
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState("Virement")
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/factures/${facture.id}/acompte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: parseFloat(montant),
          datePaiement: date,
          modePaiement: mode,
          reference: reference.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur"); setLoading(false); return }
      onSaved()
    } catch {
      setError("Erreur réseau")
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3 text-sm flex justify-between">
            <span className="text-slate-500">Reste à percevoir</span>
            <span className="font-bold text-slate-900">
              {restant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Montant (€)</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                min={0.01}
                step={0.01}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Mode de paiement</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
              >
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Référence</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° chèque, virement…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Row actions dropdown ─────────────────────────────────────────────────────

function RowActions({
  facture,
  onDelete,
  onPaiement,
  onMarkPaid,
}: {
  facture: FactureRow
  onDelete: () => void
  onPaiement: () => void
  onMarkPaid: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 208 })
    }
    setOpen(!open)
  }

  const act = (fn: () => void) => () => { setOpen(false); fn() }
  const canPay = facture.status !== "PAYEE" && facture.status !== "ANNULEE"

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
        >
          <Link
            href={`/factures/${facture.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            Voir la facture
          </Link>
          <a
            href={`/api/factures/${facture.id}/pdf`}
            download={`${facture.numero}.pdf`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            Télécharger PDF
          </a>
          <a
            href={`mailto:${facture.client.email ?? ""}?subject=Facture ${facture.numero}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            Envoyer par email
          </a>

          {canPay && <>
            <div className="my-1 border-t border-slate-100" />
            <button
              onMouseDown={(e) => { e.preventDefault(); act(onPaiement)() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Enregistrer un paiement
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); act(onMarkPaid)() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Marquer comme payée
            </button>
          </>}

          <div className="my-1 border-t border-slate-100" />
          <button
            onMouseDown={(e) => { e.preventDefault(); act(onDelete)() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Annuler / Supprimer
          </button>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {dropdown}
    </>
  )
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: "asc" | "desc" }) {
  if (active !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
  return dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, dateEcheance }: { status: string; dateEcheance: Date }) {
  const display = computeFactureStatus(status, dateEcheance)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FACTURE_STATUS_STYLES[display]}`}>
      {FACTURE_STATUS_LABELS[display]}
    </span>
  )
}

// ─── Tracking badge ───────────────────────────────────────────────────────────

function TrackingBadge({ dateEnvoi, consulted, status }: {
  dateEnvoi?: Date | null
  consulted?: boolean
  status: string
}) {
  if (status === "PAYEE") return null // statut paiement suffit
  if (consulted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Eye className="w-2.5 h-2.5" />
        Vue ✓
      </span>
    )
  }
  if (dateEnvoi) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Envoyée
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      À envoyer
    </span>
  )
}

// ─── Main table ───────────────────────────────────────────────────────────────

export function FactureTable({ factures }: { factures: FactureRow[] }) {
  const router = useRouter()
  const [sortCol, setSortCol] = useState<SortKey>("dateEmission")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [paiementModal, setPaiementModal] = useState<FactureRow | null>(null)

  const toggleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortCol(col); setSortDir("desc") }
  }

  const sorted = [...factures].sort((a, b) => {
    let cmp = 0
    switch (sortCol) {
      case "numero": cmp = a.numero.localeCompare(b.numero, "fr"); break
      case "client": cmp = clientDisplayName(a.client).localeCompare(clientDisplayName(b.client), "fr"); break
      case "dateEmission": cmp = new Date(a.dateEmission).getTime() - new Date(b.dateEmission).getTime(); break
      case "dateEcheance": cmp = new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime(); break
      case "totalTTC": cmp = a.totalTTC - b.totalTTC; break
      case "status": cmp = a.status.localeCompare(b.status); break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const markPaid = useCallback(async (id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    await fetch(`/api/factures/${id}/acompte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        montant: factures.find((f) => f.id === id)!.totalTTC - factures.find((f) => f.id === id)!.montantPaye,
        datePaiement: today,
        modePaiement: "Virement",
      }),
    })
    router.refresh()
  }, [factures, router])

  const deleteOne = useCallback(async (id: string) => {
    if (!confirm("Annuler / supprimer cette facture ?")) return
    await fetch(`/api/factures/${id}`, { method: "DELETE" })
    router.refresh()
  }, [router])

  if (factures.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-7 h-7 text-slate-400" />
        </div>
        <p className="font-medium text-slate-700">Aucune facture trouvée</p>
        <p className="text-sm text-slate-400 mt-1">Générez une facture depuis un devis accepté</p>
      </div>
    )
  }

  const th = "text-left px-3 py-3"

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={th}>
                  <button onClick={() => toggleSort("numero")} className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Numéro <SortIcon col="numero" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className={th}>
                  <button onClick={() => toggleSort("client")} className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Client <SortIcon col="client" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className={th}>
                  <button onClick={() => toggleSort("dateEmission")} className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Émission <SortIcon col="dateEmission" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className={th}>
                  <button onClick={() => toggleSort("dateEcheance")} className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Échéance <SortIcon col="dateEcheance" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-3 py-3">
                  <button onClick={() => toggleSort("totalTTC")} className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Montant TTC <SortIcon col="totalTTC" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className={th}>
                  <button onClick={() => toggleSort("status")} className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600">
                    Statut <SortIcon col="status" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Envoi</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((f) => {
                const displayStatus = computeFactureStatus(f.status, new Date(f.dateEcheance))
                const isLate = displayStatus === "EN_RETARD"
                const isPaid = f.status === "PAYEE"
                const resteAPayer = f.totalTTC - f.montantPaye

                return (
                  <tr key={f.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/factures/${f.id}`}
                        className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        {f.numero}
                      </Link>
                      {f.devis && (
                        <p className="text-xs text-slate-400 mt-1">
                          ← <Link href={`/devis/${f.devis.id}`} className="hover:text-blue-600">{f.devis.numero}</Link>
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[160px]">
                        {clientDisplayName(f.client)}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600">
                      {new Date(f.dateEmission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className={`text-sm ${isLate ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                        {new Date(f.dateEcheance).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {isLate && <p className="text-xs text-red-500 mt-0.5">En retard</p>}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">
                        {f.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                      {!isPaid && f.montantPaye > 0 && (
                        <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                          reste {resteAPayer.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={f.status} dateEcheance={new Date(f.dateEcheance)} />
                    </td>
                    <td className="px-3 py-3.5">
                      <TrackingBadge dateEnvoi={f.dateEnvoi} consulted={f.consulted} status={f.status} />
                    </td>
                    <td className="px-3 py-3.5">
                      <RowActions
                        facture={f}
                        onDelete={() => deleteOne(f.id)}
                        onPaiement={() => setPaiementModal(f)}
                        onMarkPaid={() => markPaid(f.id)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {paiementModal && (
        <PaiementModal
          facture={paiementModal}
          onClose={() => setPaiementModal(null)}
          onSaved={() => { setPaiementModal(null); router.refresh() }}
        />
      )}
    </>
  )
}
