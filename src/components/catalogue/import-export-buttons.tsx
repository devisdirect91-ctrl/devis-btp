"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ImportResult {
  created: number
  errors: string[]
  total: number
}

export function ImportExportButtons() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleExport = () => {
    window.location.href = "/api/catalogue/export"
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResult(null)
    setImportError(null)

    const text = await file.text()

    startTransition(async () => {
      const res = await fetch("/api/catalogue/import", {
        method: "POST",
        body: text,
        headers: { "Content-Type": "text/plain" },
      })
      const data = await res.json()

      if (!res.ok) {
        setImportError(data.error || "Erreur lors de l'import")
      } else {
        setResult(data)
        router.refresh()
      }

      // Reset file input
      if (fileRef.current) fileRef.current.value = ""
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Import result toast */}
      {result && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {result.created} prestation{result.created > 1 ? "s" : ""} importée{result.created > 1 ? "s" : ""}
          {result.errors.length > 0 && ` (${result.errors.length} erreur${result.errors.length > 1 ? "s" : ""})`}
        </div>
      )}
      {importError && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {importError}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
        title="Importer des prestations depuis un fichier CSV"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        Importer CSV
      </button>

      <button
        onClick={handleExport}
        title="Exporter le catalogue en CSV"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Exporter CSV
      </button>
    </div>
  )
}
