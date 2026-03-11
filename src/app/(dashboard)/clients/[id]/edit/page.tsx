import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ClientForm } from "@/components/clients/client-form"
import { clientDisplayName } from "@/lib/client-utils"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const client = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!client) notFound()

  const displayName = clientDisplayName(client)

  // Map Prisma model to form default values
  const defaultValues = {
    type: client.type,
    civilite: client.civilite ?? "",
    nom: client.nom,
    prenom: client.prenom ?? "",
    email: client.email ?? "",
    telephone: client.telephone ?? "",
    portable: client.portable ?? "",
    adresse: client.adresse ?? "",
    complement: client.complement ?? "",
    codePostal: client.codePostal ?? "",
    ville: client.ville ?? "",
    pays: client.pays ?? "France",
    societe: client.societe ?? "",
    siret: client.siret ?? "",
    tvaIntra: client.tvaIntra ?? "",
    rcs: client.rcs ?? "",
    notes: client.notes ?? "",
  }

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
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors truncate max-w-[160px]"
        >
          {displayName}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-900 font-medium">Modifier</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Modifier le client</h1>
        <p className="text-sm text-slate-500 mt-1">{displayName}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <ClientForm defaultValues={defaultValues} clientId={client.id} />
      </div>
    </div>
  )
}
