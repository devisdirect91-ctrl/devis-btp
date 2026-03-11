import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export const metadata = { title: "Paramètres — DevisBTP" }

export default async function ParametresPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      companyName: true,
      companyFormeJuridique: true,
      companyCapital: true,
      companySiret: true,
      companyApe: true,
      companyTvaIntra: true,
      companyRcs: true,
      companyAddress: true,
      companyPostalCode: true,
      companyCity: true,
      companyPhone: true,
      companyEmail: true,
      companySiteWeb: true,
      companyLogo: true,
      assuranceNom: true,
      assuranceNumero: true,
      assurancePeriode: true,
      assuranceCouverture: true,
      assuranceRcProNom: true,
      assuranceRcProNumero: true,
      mentionsLegalesDefaut: true,
      prefixeDevis: true,
      validiteDevisDefaut: true,
      conditionsPaiementDefaut: true,
      penalitesRetard: true,
      tauxTvaDefaut: true,
      messageFinDevis: true,
      couleurPrimaire: true,
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez votre entreprise, vos devis et votre compte</p>
        </div>
        <SettingsTabs user={user} />
      </div>
    </div>
  )
}
