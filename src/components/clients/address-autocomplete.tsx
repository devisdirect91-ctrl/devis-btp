"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Loader2 } from "lucide-react"

interface AddressSuggestion {
  label: string
  housenumber?: string
  street?: string
  postcode: string
  city: string
  context: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (data: { adresse: string; codePostal: string; ville: string }) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une adresse…",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleChange = (val: string) => {
    onChange(val)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (val.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&limit=5&type=housenumber,street`
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        const results: AddressSuggestion[] = data.features.map((f: any) => ({
          label: f.properties.label,
          housenumber: f.properties.housenumber,
          street: f.properties.street,
          postcode: f.properties.postcode,
          city: f.properties.city,
          context: f.properties.context,
        }))
        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  const handleSelect = (suggestion: AddressSuggestion) => {
    const adresse = [suggestion.housenumber, suggestion.street]
      .filter(Boolean)
      .join(" ") || suggestion.label
    onSelect({
      adresse,
      codePostal: suggestion.postcode,
      ville: suggestion.city,
    })
    onChange(adresse)
    setIsOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(s)
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-start gap-2.5 border-b border-slate-50 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-900 truncate">{s.label}</p>
                <p className="text-xs text-slate-400 truncate">{s.context}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
