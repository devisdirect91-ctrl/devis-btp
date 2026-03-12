import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const factureToken = await prisma.factureToken.findUnique({
    where: { token },
    include: {
      facture: {
        include: {
          client: true,
          lignes: { orderBy: { ordre: "asc" } },
          user: {
            select: {
              companyName: true,
              companyLogo: true,
              companyAddress: true,
              companyPostalCode: true,
              companyCity: true,
              companyPhone: true,
              companyEmail: true,
              companySiret: true,
              companyTvaIntra: true,
              companyFormeJuridique: true,
              companyCapital: true,
              couleurPrimaire: true,
            },
          },
        },
      },
    },
  })

  if (!factureToken) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 })
  }

  if (new Date() > factureToken.expiresAt) {
    return NextResponse.json({ error: "Ce lien a expiré", expired: true }, { status: 410 })
  }

  // Enregistre la première consultation
  if (!factureToken.consultedAt) {
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null

    await prisma.factureToken.update({
      where: { token },
      data: { consultedAt: new Date(), consultedIp: ip },
    })
  }

  const { facture } = factureToken
  const clientName =
    facture.client.type === "PROFESSIONNEL" && (facture.client as any).societe
      ? (facture.client as any).societe
      : [(facture.client as any).civilite, facture.client.prenom, facture.client.nom]
          .filter(Boolean)
          .join(" ")

  return NextResponse.json({
    facture: {
      numero: facture.numero,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      totalHT: facture.totalHT,
      totalTva: facture.totalTva,
      totalTTC: facture.totalTTC,
      conditionsPaiement: facture.conditionsPaiement,
      notes: facture.notes,
      mentionsLegales: facture.mentionsLegales,
    },
    client: { ...facture.client, displayName: clientName },
    lignes: facture.lignes,
    user: facture.user,
    token: { consultedAt: factureToken.consultedAt },
  })
}
