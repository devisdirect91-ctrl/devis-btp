"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Receipt,
  Users,
  Package,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/devis", label: "Mes devis", icon: FileText, exact: false },
  { href: "/factures", label: "Mes factures", icon: Receipt, exact: false },
  { href: "/clients", label: "Clients", icon: Users, exact: false },
  { href: "/catalogue", label: "Catalogue", icon: Package, exact: false },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col">
      <Link
        href="/devis/nouveau"
        className="flex items-center gap-2.5 px-3 py-2.5 mb-4 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors font-semibold text-sm shadow-sm"
      >
        <FilePlus className="w-4 h-4 flex-shrink-0" />
        <span>Nouveau devis</span>
      </Link>

      <div className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? "text-amber-400" : "text-slate-500"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 space-y-0.5">
        <Link
          href="/parametres"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            pathname === "/parametres"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings
            className={`w-4 h-4 flex-shrink-0 ${
              pathname === "/parametres" ? "text-amber-400" : "text-slate-500"
            }`}
          />
          <span>Paramètres</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </nav>
  );
}
