import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatNumero } from "@/lib/devis-utils"
import { DevisEditor } from "@/components/devis/devis-editor"

export const metadata = { title: "Nouveau devis — BTPoche" }

export default async function NouveauDevisPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const [user, lastDevis] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        tauxTvaDefaut: true,
        validiteDevisDefaut: true,
        conditionsPaiementDefaut: true,
        mentionsLegalesDefaut: true,
      },
    }),
    prisma.devis.findFirst({
      where: { userId, numeroAnnee: new Date().getFullYear() },
      orderBy: { numeroSequence: "desc" },
      select: { numeroSequence: true },
    }),
  ])

  const year = new Date().getFullYear()
  const seq = (lastDevis?.numeroSequence ?? 0) + 1
  const numero = formatNumero(year, seq)

  return (
    <DevisEditor
      numero={numero}
      tauxTvaDefaut={user?.tauxTvaDefaut ?? 20}
      conditionsPaiementDefaut={user?.conditionsPaiementDefaut ?? ""}
      mentionsLegalesDefaut={user?.mentionsLegalesDefaut ?? ""}
    />
  )
}
