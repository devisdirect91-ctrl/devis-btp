import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import { FacturePDF } from "@/lib/pdf/facture-pdf"
import { createElement } from "react"
import type { FacturePdfData } from "@/lib/pdf/facture-pdf"

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
          acomptes: { orderBy: { datePaiement: "asc" } },
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
              companyRcs: true,
              companyFormeJuridique: true,
              companyCapital: true,
              couleurPrimaire: true,
            },
          },
        },
      },
    },
  })

  if (!factureToken) return NextResponse.json({ error: "Lien invalide" }, { status: 404 })
  if (new Date() > factureToken.expiresAt) {
    return NextResponse.json({ error: "Lien expiré" }, { status: 410 })
  }

  const { facture } = factureToken

  const data: FacturePdfData = {
    facture: {
      numero: facture.numero,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      totalHT: facture.totalHT,
      totalTva: facture.totalTva,
      totalTTC: facture.totalTTC,
      montantPaye: facture.montantPaye,
      status: facture.status,
      conditionsPaiement: facture.conditionsPaiement,
      notes: facture.notes,
      mentionsLegales: facture.mentionsLegales,
    },
    client: {
      civilite: (facture.client as any).civilite,
      prenom: facture.client.prenom,
      nom: facture.client.nom,
      societe: facture.client.societe,
      type: facture.client.type,
      adresse: facture.client.adresse,
      codePostal: facture.client.codePostal,
      ville: facture.client.ville,
      telephone: facture.client.telephone,
      portable: facture.client.portable,
      email: facture.client.email,
    },
    lignes: facture.lignes.map((l) => ({
      ligneType: l.ligneType,
      ordre: l.ordre,
      designation: l.designation,
      description: l.description,
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaireHT: l.prixUnitaireHT,
      remise: l.remise,
      tauxTva: l.tauxTva,
      totalHtNet: l.totalHtNet,
      totalTTC: l.totalTTC,
    })),
    user: facture.user,
    acomptes: facture.acomptes.map((a) => ({
      montant: a.montant,
      datePaiement: a.datePaiement,
      modePaiement: a.modePaiement,
      reference: a.reference,
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(FacturePDF, data) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${facture.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
