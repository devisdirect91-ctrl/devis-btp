import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HardHat, Bell, ChevronDown } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userName = session?.user?.name || session?.user?.email || "Mode test";
  const firstName = session?.user?.name?.split(" ")[0] ?? userName;
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (session?.user?.email?.[0] ?? "T").toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-white tracking-tight">DevisBTP</span>
            <p className="text-xs text-slate-500 truncate">Gestion de devis</p>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav />

        {/* User profile */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-4 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div />

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
              <span className="text-sm font-medium text-slate-700">{firstName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
