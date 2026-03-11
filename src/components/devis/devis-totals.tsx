"use client"

import { formatEur } from "@/lib/devis-utils"
import type { DevisTotaux } from "@/lib/devis-utils"

interface DevisTotalsProps {
  totaux: DevisTotaux
  remiseGlobale: number
  remiseGlobaleType: "PERCENT" | "AMOUNT"
  acompte: number
  acompteType: "PERCENT" | "AMOUNT"
  onRemiseGlobaleChange: (v: number) => void
  onRemiseGlobaleTypeChange: (t: "PERCENT" | "AMOUNT") => void
  onAcompteChange: (v: number) => void
  onAcompteTypeChange: (t: "PERCENT" | "AMOUNT") => void
}

export function DevisTotals({
  totaux,
  remiseGlobale,
  remiseGlobaleType,
  acompte,
  acompteType,
  onRemiseGlobaleChange,
  onRemiseGlobaleTypeChange,
  onAcompteChange,
  onAcompteTypeChange,
}: DevisTotalsProps) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
      {/* HT brut + remises lignes */}
      {totaux.totalRemiseLignes > 0 && (
        <>
          <Row label="Total HT brut" value={formatEur(totaux.totalHtBrut)} muted />
          <Row label="Remises lignes" value={`− ${formatEur(totaux.totalRemiseLignes)}`} muted />
        </>
      )}

      <Row label="Total HT" value={formatEur(totaux.totalHT)} />

      {/* Remise globale */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">Remise globale</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="0.1"
            value={remiseGlobale}
            onChange={(e) => onRemiseGlobaleChange(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <select
            value={remiseGlobaleType}
            onChange={(e) => onRemiseGlobaleTypeChange(e.target.value as "PERCENT" | "AMOUNT")}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="PERCENT">%</option>
            <option value="AMOUNT">€</option>
          </select>
          {totaux.totalRemiseGlobale > 0 && (
            <span className="text-xs text-slate-500 min-w-[70px] text-right">
              − {formatEur(totaux.totalRemiseGlobale)}
            </span>
          )}
        </div>
      </div>

      {totaux.totalRemiseGlobale > 0 && (
        <Row label="Total HT net" value={formatEur(totaux.totalHtNet)} />
      )}

      {/* TVA breakdown */}
      <div className="border-t border-slate-200 pt-3 space-y-1.5">
        {totaux.tvaDetails.length === 0 ? (
          <Row label="TVA" value={formatEur(0)} muted />
        ) : (
          totaux.tvaDetails.map((t) => (
            <Row
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

      {/* Acompte */}
      <div className="border-t border-slate-200 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Acompte</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="0.1"
              value={acompte}
              onChange={(e) => onAcompteChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <select
              value={acompteType}
              onChange={(e) => onAcompteTypeChange(e.target.value as "PERCENT" | "AMOUNT")}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="PERCENT">%</option>
              <option value="AMOUNT">€</option>
            </select>
            {totaux.acompteMontant > 0 && (
              <span className="text-xs text-slate-500 min-w-[70px] text-right">
                {formatEur(totaux.acompteMontant)}
              </span>
            )}
          </div>
        </div>

        {totaux.acompteMontant > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Net à payer</span>
            <span className="text-sm font-semibold text-blue-600">{formatEur(totaux.netAPayer)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-slate-500" : "text-slate-700"}`}>{label}</span>
      <span className={`text-sm ${muted ? "text-slate-500" : "font-medium text-slate-900"}`}>{value}</span>
    </div>
  )
}
