import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DevisEditor } from "@/components/devis/devis-editor"
import type { DevisInitialData } from "@/components/devis/devis-editor"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devis = await prisma.devis.findFirst({ where: { id }, select: { numero: true } })
  if (!devis) return {}
  return { title: `Modifier ${devis.numero} — BTPoche` }
}

export default async function ModifierDevisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const [devis, user] = await Promise.all([
    prisma.devis.findFirst({
      where: { id, userId: session.user.id },
      include: { lignes: { orderBy: { ordre: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tauxTvaDefaut: true,
        conditionsPaiementDefaut: true,
        mentionsLegalesDefaut: true,
      },
    }),
  ])

  if (!devis) notFound()

  // Compute validiteJours from dateEmission + dateValidite
  let validiteJours = 30
  if (devis.dateValidite) {
    const diff = new Date(devis.dateValidite).getTime() - new Date(devis.dateEmission).getTime()
    validiteJours = Math.round(diff / 86400_000)
  }

  const initialData: DevisInitialData = {
    titre: devis.titre,
    clientId: devis.clientId,
    dateEmission: new Date(devis.dateEmission).toISOString().slice(0, 10),
    validiteJours,
    adresseChantier: devis.adresseChantier ?? "",
    objetTravaux: devis.objetTravaux ?? "",
    dateDebutPrevisionnel: devis.dateDebutPrevisionnel
      ? new Date(devis.dateDebutPrevisionnel).toISOString().slice(0, 10)
      : "",
    remiseGlobale: devis.remiseGlobale ?? 0,
    remiseGlobaleType: (devis.remiseGlobaleType as "PERCENT" | "AMOUNT") ?? "PERCENT",
    acompte: devis.acompte ?? 0,
    acompteType: (devis.acompteType as "PERCENT" | "AMOUNT") ?? "PERCENT",
    conditionsPaiement: devis.conditionsPaiement ?? "",
    delaiExecution: devis.delaiExecution ?? "",
    notes: devis.notes ?? "",
    mentionsLegales: devis.mentionsLegales ?? "",
    lignes: devis.lignes.map((l) => ({
      id: l.id,
      ligneType: l.ligneType as "LINE" | "SECTION",
      designation: l.designation,
      description: l.description ?? "",
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaireHT: l.prixUnitaireHT,
      remise: l.remise,
      tauxTva: l.tauxTva,
      catalogItemId: l.catalogItemId ?? null,
    })),
  }

  return (
    <DevisEditor
      numero={devis.numero}
      tauxTvaDefaut={user?.tauxTvaDefaut ?? 20}
      conditionsPaiementDefaut={user?.conditionsPaiementDefaut ?? ""}
      mentionsLegalesDefaut={user?.mentionsLegalesDefaut ?? ""}
      editId={devis.id}
      initialData={initialData}
    />
  )
}
