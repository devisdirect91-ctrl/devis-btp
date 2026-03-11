"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState } from "react"
import { Search, X } from "lucide-react"

interface ClientFiltersProps {
  search: string
  type: string
}

const TYPE_TABS = [
  { value: "", label: "Tous" },
  { value: "PARTICULIER", label: "Particuliers" },
  { value: "PROFESSIONNEL", label: "Professionnels" },
]

export function ClientFilters({ search: initialSearch, type: initialType }: ClientFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page") // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => updateParams("search", value), 400)
    setDebounceTimer(timer)
  }

  const clearSearch = () => {
    setSearchValue("")
    updateParams("search", "")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher un client…"
          className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams("type", tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              initialType === tab.value
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
