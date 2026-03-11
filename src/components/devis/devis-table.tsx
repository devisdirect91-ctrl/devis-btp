"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye, Edit, Copy, FileDown, Mail, Trash2,
  MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  Download, X, FileText,
} from "lucide-react"
import { clientDisplayName } from "@/lib/client-utils"
import { StatusBadge } from "./status-badge"

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  id: string
  nom: string
  prenom?: string | null
  societe?: string | null
  type: string
  email?: string | null
  ville?: string | null
}

export type DevisRow = {
  id: string
  numero: string
  titre: string
  status: string
  dateEmission: Date
  dateValidite?: Date | null
  dateEnvoi?: Date | null
  totalHT: number
  totalTTC: number
  createdAt: Date
  client: Client
}

type SortKey = "dateEmission" | "numero" | "client" | "totalTTC" | "status"

// ─── Email modal ──────────────────────────────────────────────────────────────

function EmailModal({
  devis,
  onClose,
  onSent,
}: {
  devis: DevisRow
  onClose: () => void
  onSent: () => void
}) {
  const email = devis.client.email ?? ""
  const subject = `Devis ${devis.numero} — ${devis.titre}`
  const body = `Bonjour,\n\nVeuillez trouver ci-joint notre devis ${devis.numero}.\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement`
  const mailtoHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const [marked, setMarked] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (marked) {
      setIsLoading(true)
      await fetch(`/api/devis/${devis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENVOYE" }),
      })
      setIsLoading(false)
      onSent()
    }
    window.open(mailtoHref, "_blank")
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Envoyer par email</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-slate-500 w-20 flex-shrink-0">À :</span>
              <span className="font-medium text-slate-900">
                {email || <span className="text-orange-500 italic">Aucun email renseigné pour ce client</span>}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-20 flex-shrink-0">Objet :</span>
              <span className="text-slate-700">{subject}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marked}
              onChange={(e) => setMarked(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span className="text-sm text-slate-600">
              Marquer ce devis comme <strong>Envoyé</strong> après ouverture de la messagerie
            </span>
          </label>
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !email}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            Ouvrir la messagerie
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Row actions dropdown ─────────────────────────────────────────────────────

function RowActions({
  devis,
  onDelete,
  onEmail,
  onDuplicate,
}: {
  devis: DevisRow
  onDelete: () => void
  onEmail: () => void
  onDuplicate: () => void
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

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
        >
          <MenuItem icon={Eye} href={`/devis/${devis.id}`} label="Voir le devis" onClose={() => setOpen(false)} />
          {(devis.status === "BROUILLON" || devis.status === "ENVOYE") && (
            <MenuItem icon={Edit} href={`/devis/${devis.id}/modifier`} label="Modifier" onClose={() => setOpen(false)} />
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); act(onDuplicate)() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4 text-slate-400" />
            Dupliquer
          </button>
          <a
            href={`/api/devis/${devis.id}/pdf`}
            download={`${devis.numero}.pdf`}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            Télécharger PDF
          </a>
          <button
            onMouseDown={(e) => { e.preventDefault(); act(onEmail)() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            Envoyer par email
          </button>

          <div className="my-1 border-t border-slate-100" />
          <button
            onMouseDown={(e) => { e.preventDefault(); act(onDelete)() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
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

function MenuItem({ icon: Icon, href, label, onClose }: { icon: React.ElementType; href: string; label: string; onClose: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-400" />
      {label}
    </Link>
  )
}

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: "asc" | "desc" }) {
  if (active !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
  return dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

// ─── Main table ───────────────────────────────────────────────────────────────

interface DevisTableProps {
  devis: DevisRow[]
}

export function DevisTable({ devis }: DevisTableProps) {
  const router = useRouter()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortCol, setSortCol] = useState<SortKey>("dateEmission")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [emailModal, setEmailModal] = useState<DevisRow | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Derived state
  const allSelected = devis.length > 0 && selected.size === devis.length
  const someSelected = selected.size > 0 && !allSelected

  // Sort
  const sorted = [...devis].sort((a, b) => {
    let cmp = 0
    switch (sortCol) {
      case "numero":
        cmp = a.numero.localeCompare(b.numero, "fr")
        break
      case "client":
        cmp = clientDisplayName(a.client).localeCompare(clientDisplayName(b.client), "fr")
        break
      case "dateEmission":
        cmp = new Date(a.dateEmission).getTime() - new Date(b.dateEmission).getTime()
        break
      case "totalTTC":
        cmp = a.totalTTC - b.totalTTC
        break
      case "status":
        cmp = a.status.localeCompare(b.status)
        break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const toggleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortCol(col); setSortDir("desc") }
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(devis.map((d) => d.id)))

  const changeStatus = useCallback(async (id: string, status: string) => {
    await fetch(`/api/devis/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }, [router])

  const deleteOne = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce devis définitivement ?")) return
    await fetch(`/api/devis/${id}`, { method: "DELETE" })
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    router.refresh()
  }, [router])

  const duplicateOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/devis/${id}/duplicate`, { method: "POST" })
    const data = await res.json()
    if (data.devis?.id) router.push(`/devis/${data.devis.id}/modifier`)
  }, [router])

  const bulkDelete = async () => {
    const n = selected.size
    if (!confirm(`Supprimer ${n} devis définitivement ? Cette action est irréversible.`)) return
    setIsProcessing(true)
    await fetch("/api/devis/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    })
    setSelected(new Set())
    setIsProcessing(false)
    router.refresh()
  }

  const exportSelected = () => {
    const ids = selected.size > 0 ? Array.from(selected).join(",") : ""
    window.location.href = `/api/devis/export${ids ? `?ids=${ids}` : ""}`
  }

  const exportAll = () => { window.location.href = "/api/devis/export" }

  // ── Empty state
  if (devis.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <p className="font-medium text-slate-700">Aucun devis trouvé</p>
        <p className="text-sm text-slate-400 mt-1">Modifiez vos filtres ou créez un nouveau devis</p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl mb-2">
          <span className="text-sm font-medium">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter
            </button>
            <button
              onClick={bulkDelete}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Export all button */}
        <div className="flex items-center justify-end px-4 py-2.5 border-b border-slate-50">
          <button
            onClick={exportAll}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left px-3 py-3">
                  <button
                    onClick={() => toggleSort("numero")}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
                  >
                    Numéro <SortIcon col="numero" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-3 py-3">
                  <button
                    onClick={() => toggleSort("client")}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
                  >
                    Client / Objet <SortIcon col="client" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-3 py-3">
                  <button
                    onClick={() => toggleSort("dateEmission")}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
                  >
                    Date <SortIcon col="dateEmission" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-3 py-3">
                  <button
                    onClick={() => toggleSort("totalTTC")}
                    className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
                  >
                    Montant TTC <SortIcon col="totalTTC" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-3 py-3">
                  <button
                    onClick={() => toggleSort("status")}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
                  >
                    Statut <SortIcon col="status" active={sortCol} dir={sortDir} />
                  </button>
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((d) => {
                const isExpired =
                  d.status === "ENVOYE" && d.dateValidite && new Date(d.dateValidite) < new Date()
                const displayStatus = isExpired ? "EXPIRE" : d.status

                return (
                  <tr
                    key={d.id}
                    className={`group transition-colors hover:bg-slate-50/50 ${
                      selected.has(d.id) ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/devis/${d.id}`}
                        className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        {d.numero}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 max-w-xs">
                      <Link href={`/devis/${d.id}`} className="hover:text-blue-600 transition-colors">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.titre}</p>
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{clientDisplayName(d.client)}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm text-slate-600">
                        {new Date(d.dateEmission).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {d.dateValidite && (
                        <p className={`text-xs mt-0.5 ${isExpired ? "text-orange-500 font-medium" : "text-slate-400"}`}>
                          {isExpired ? "Expiré" : "val. "}
                          {!isExpired && new Date(d.dateValidite).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">
                        {d.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                      {d.totalHT !== d.totalTTC && (
                        <p className="text-xs text-slate-400 tabular-nums">
                          {d.totalHT.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} HT
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge devisId={d.id} status={d.status} />
                    </td>
                    <td className="px-3 py-3.5">
                      <RowActions
                        devis={d}
                        onDelete={() => deleteOne(d.id)}
                        onEmail={() => setEmailModal(d)}
                        onDuplicate={() => duplicateOne(d.id)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email modal */}
      {emailModal && (
        <EmailModal
          devis={emailModal}
          onClose={() => setEmailModal(null)}
          onSent={() => { setEmailModal(null); router.refresh() }}
        />
      )}
    </>
  )
}
