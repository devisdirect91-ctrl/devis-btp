import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ClientForm } from "@/components/clients/client-form"

export const metadata = { title: "Nouveau client — DevisBTP" }

export default async function NewClientPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Clients
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-900 font-medium">Nouveau client</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nouveau client</h1>
        <p className="text-sm text-slate-500 mt-1">
          Renseignez les coordonnées de votre client pour pouvoir lui établir des devis.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <ClientForm />
      </div>
    </div>
  )
}
