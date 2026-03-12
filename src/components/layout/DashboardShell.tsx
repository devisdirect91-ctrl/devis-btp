"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { HardHat, Bell, ChevronDown, Menu, X } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/layout/MobileNav"

interface DashboardShellProps {
  children: React.ReactNode
  userName: string
  firstName: string
  initials: string
  email: string
}

export function DashboardShell({
  children,
  userName,
  firstName,
  initials,
  email,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Ferme le sidebar mobile à chaque changement de page
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Verrouille le scroll body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-72 md:w-64 bg-slate-900 flex flex-col flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo + close (mobile) */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-white tracking-tight">DevisBTP</span>
            <p className="text-xs text-slate-500 truncate">Gestion de devis</p>
          </div>
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <SidebarNav />

        {/* Profil utilisateur */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-4 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">

          {/* Gauche : hamburger (mobile) */}
          <button
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo centré sur mobile */}
          <div className="md:hidden flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
              <HardHat className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">DevisBTP</span>
          </div>

          {/* Espace desktop */}
          <div className="hidden md:block flex-1" />

          {/* Droite : actions */}
          <div className="flex items-center gap-2">
            <button
              className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <Link
              href="/parametres"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700">{firstName}</span>
              <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Contenu — padding bottom sur mobile pour la nav */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <MobileNav />
    </div>
  )
}
