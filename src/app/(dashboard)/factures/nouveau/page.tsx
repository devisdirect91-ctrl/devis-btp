import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FactureEditor } from "@/components/factures/facture-editor"

export const metadata = { title: "Nouvelle facture — BTPoche" }

function formatFactureNumero(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(3, "0")}`
}

export default async function NouvelleFacturePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const [user, lastFacture] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        tauxTvaDefaut: true,
        conditionsPaiementDefaut: true,
        mentionsLegalesDefaut: true,
      },
    }),
    prisma.facture.findFirst({
      where: { userId, numeroAnnee: new Date().getFullYear() },
      orderBy: { numeroSequence: "desc" },
      select: { numeroSequence: true },
    }),
  ])

  const year = new Date().getFullYear()
  const seq = (lastFacture?.numeroSequence ?? 0) + 1
  const numero = formatFactureNumero(year, seq)

  return (
    <FactureEditor
      numero={numero}
      tauxTvaDefaut={user?.tauxTvaDefaut ?? 20}
      conditionsPaiementDefaut={user?.conditionsPaiementDefaut ?? ""}
      mentionsLegalesDefaut={user?.mentionsLegalesDefaut ?? ""}
    />
  )
}
