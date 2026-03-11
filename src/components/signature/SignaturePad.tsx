"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import SignaturePadLib from "signature_pad"
import { Trash2, Check, PenLine, AlertTriangle } from "lucide-react"

interface SignaturePadProps {
  onConfirm: (dataUrl: string) => void
  primaryColor?: string
  loading?: boolean
}

export function SignaturePad({ onConfirm, primaryColor = "#1d4ed8", loading = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [canvasSupported, setCanvasSupported] = useState(true)
  const [fallback, setFallback] = useState(false)

  // Resize canvas to match physical pixels (retina support)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !padRef.current) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const width = container.clientWidth
    const height = container.clientHeight

    // Save current signature as data before resize
    const data = padRef.current.toData()

    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.getContext("2d")?.scale(ratio, ratio)

    padRef.current.clear()
    padRef.current.fromData(data)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check canvas support
    if (!canvas.getContext) {
      setCanvasSupported(false)
      return
    }

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#1e293b",
      minWidth: 1.2,
      maxWidth: 3.5,
      throttle: 16,
      velocityFilterWeight: 0.7,
    })

    pad.addEventListener("beginStroke", () => setIsEmpty(false))

    padRef.current = pad
    resizeCanvas()

    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      pad.off()
    }
  }, [resizeCanvas])

  const handleClear = () => {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  const handleConfirm = () => {
    const pad = padRef.current
    if (!pad || pad.isEmpty()) return
    // Export as transparent PNG
    const dataUrl = pad.toDataURL("image/png")
    onConfirm(dataUrl)
  }

  if (!canvasSupported || fallback) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Canvas non supporté</p>
            <p>Votre navigateur ne supporte pas la signature manuscrite. Cochez la case ci-dessous pour accepter le devis.</p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                // Generate a placeholder acceptance confirmation
                const canvas = document.createElement("canvas")
                canvas.width = 400
                canvas.height = 80
                const ctx = canvas.getContext("2d")!
                ctx.fillStyle = "#f8fafc"
                ctx.fillRect(0, 0, 400, 80)
                ctx.fillStyle = "#334155"
                ctx.font = "italic 18px Georgia, serif"
                ctx.textAlign = "center"
                ctx.fillText("✓ Accepté électroniquement", 200, 48)
                onConfirm(canvas.toDataURL("image/png"))
              }
            }}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 cursor-pointer flex-shrink-0"
            style={{ accentColor: primaryColor }}
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold">J&apos;accepte ce devis</span> et confirme mon accord électronique en lieu et place d&apos;une signature manuscrite.
          </span>
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Canvas zone */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/80 transition-colors hover:border-slate-300"
        style={{ height: "180px" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />

        {/* Watermark — hidden once user starts drawing */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-2">
            <PenLine className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
            <span className="text-sm text-slate-300 font-medium tracking-wide">Signez ici</span>
          </div>
        )}

        {/* Baseline rule */}
        <div
          className="absolute bottom-10 left-8 right-8 border-b border-slate-200 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 text-center">
        Dessinez votre signature au doigt ou à la souris
        {" · "}
        <button
          type="button"
          onClick={() => setFallback(true)}
          className="underline underline-offset-2 hover:text-slate-600 transition-colors"
        >
          Problème de signature ?
        </button>
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty || loading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Effacer
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isEmpty || loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: isEmpty || loading ? undefined : primaryColor,
            background: isEmpty || loading
              ? undefined
              : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          }}
        >
          <Check className="w-4 h-4" />
          Valider ma signature
        </button>
      </div>
    </div>
  )
}
