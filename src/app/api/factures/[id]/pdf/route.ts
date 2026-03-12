import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import { FacturePDF } from "@/lib/pdf/facture-pdf"
import { createElement } from "react"
import type { FacturePdfData } from "@/lib/pdf/facture-pdf"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      acomptes: { orderBy: { datePaiement: "asc" } },
      devis: { select: { numero: true, titre: true } },
    },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  })

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
    user: user ?? {},
    acomptes: facture.acomptes.map((a) => ({
      montant: a.montant,
      datePaiement: a.datePaiement,
      modePaiement: a.modePaiement,
      reference: a.reference,
    })),
    devisRef: facture.devis ?? null,
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
