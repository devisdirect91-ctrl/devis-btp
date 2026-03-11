import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  // Profil entreprise
  companyName: z.string().nullish(),
  companyFormeJuridique: z.string().nullish(),
  companyCapital: z.string().nullish(),
  companySiret: z.string().nullish(),
  companyApe: z.string().nullish(),
  companyTvaIntra: z.string().nullish(),
  companyRcs: z.string().nullish(),
  companyAddress: z.string().nullish(),
  companyPostalCode: z.string().nullish(),
  companyCity: z.string().nullish(),
  companyPhone: z.string().nullish(),
  companyEmail: z.string().email().nullish().or(z.literal("")),
  companySiteWeb: z.string().nullish(),
  // Mentions légales
  assuranceNom: z.string().nullish(),
  assuranceNumero: z.string().nullish(),
  assurancePeriode: z.string().nullish(),
  assuranceCouverture: z.string().nullish(),
  assuranceRcProNom: z.string().nullish(),
  assuranceRcProNumero: z.string().nullish(),
  mentionsLegalesDefaut: z.string().nullish(),
  // Paramètres devis
  prefixeDevis: z.string().nullish(),
  validiteDevisDefaut: z.number().int().min(1).max(365).nullish(),
  conditionsPaiementDefaut: z.string().nullish(),
  penalitesRetard: z.string().nullish(),
  tauxTvaDefaut: z.number().min(0).max(100).nullish(),
  messageFinDevis: z.string().nullish(),
  // Personnalisation
  couleurPrimaire: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Clean up empty strings to null
  const cleaned = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
  )

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: cleaned,
  })

  return NextResponse.json({ ok: true, user })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
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
      name: true,
      email: true,
    },
  })

  return NextResponse.json(user)
}
