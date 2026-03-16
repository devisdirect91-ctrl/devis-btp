"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { HardHat, Bell, ChevronDown, Menu, X, Settings, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileNav } from "@/components/layout/MobileNav"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Ferme les menus à chaque changement de page
  useEffect(() => {
    setSidebarOpen(false)
    setSettingsOpen(false)
  }, [pathname])

  // Ferme le dropdown réglages au clic extérieur
  useEffect(() => {
    if (!settingsOpen) return
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [settingsOpen])

  // Verrouille le scroll body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  return (
    <div className="flex min-h-screen bg-slate-50">

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
          fixed md:sticky md:top-0 md:h-screen md:overflow-y-auto inset-y-0 left-0 z-30
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
            <span className="text-sm font-bold text-white tracking-tight">BTPoche</span>
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
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-40 h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">

          {/* Gauche : hamburger (mobile) */}
          <button
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo centré sur mobile */}
          <div className="md:hidden flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
              <HardHat className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">BTPoche</span>
          </div>

          {/* Espace desktop */}
          <div className="hidden md:block flex-1" />

          {/* Droite : bouton réglages (mobile + desktop) */}
          <div ref={settingsRef} className="relative flex-shrink-0">

            {/* Mobile : icône réglages */}
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-600"
              aria-label="Réglages"
            >
              {settingsOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </button>

            {/* Desktop : profil + chevron */}
            <div className="hidden md:flex items-center gap-2">
              <button
                className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSettingsOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium text-slate-700">{firstName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Dropdown */}
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
                <Link
                  href="/parametres"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Paramètres
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenu — padding bottom sur mobile pour la nav */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* FAB mobile */}
      <div className="md:hidden">
        <FloatingActionButton />
      </div>

      {/* Bottom nav mobile */}
      <MobileNav />
    </div>
  )
}
