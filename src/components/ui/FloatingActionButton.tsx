"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, FileText, Receipt } from "lucide-react"

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Container — pointer-events-none pour ne pas bloquer la zone vide */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">

        {/* Options */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 ${
            isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {/* Facture */}
          <Link
            href="/factures/nouveau"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 pl-4 pr-2 py-2 bg-blue-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-sm font-semibold">Facture</span>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </Link>

          {/* Devis */}
          <Link
            href="/devis/nouveau"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 pl-4 pr-2 py-2 bg-orange-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-sm font-semibold">Devis</span>
            <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Bouton principal — pointer-events-auto pour réactiver le clic */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
            isOpen ? "bg-gray-800" : "bg-orange-500"
          }`}
        >
          <Plus
            className={`w-7 h-7 text-white transition-transform duration-200 ${
              isOpen ? "rotate-45" : "rotate-0"
            }`}
          />
        </button>
      </div>
    </>
  )
}
