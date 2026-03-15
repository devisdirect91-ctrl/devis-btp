import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import { DevisPDF } from "@/lib/pdf/devis-pdf"
import { generateSignedPdfBuffer } from "@/lib/pdf/generate-signed-pdf"
import { createElement } from "react"
import type { DevisPdfData } from "@/lib/pdf/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
    },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  // Si le PDF signé est déjà stocké dans Supabase → redirect direct
  if (devis.signedPdfUrl) {
    return NextResponse.redirect(devis.signedPdfUrl)
  }

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
      assuranceNom: true,
      assuranceNumero: true,
      couleurPrimaire: true,
    },
  })

  const data: DevisPdfData = {
    devis: {
      numero: devis.numero,
      titre: devis.titre,
      status: devis.status,
      dateEmission: devis.dateEmission,
      dateValidite: devis.dateValidite,
      adresseChantier: devis.adresseChantier,
      objetTravaux: devis.objetTravaux,
      dateDebutPrevisionnel: devis.dateDebutPrevisionnel,
      remiseGlobale: devis.remiseGlobale,
      remiseGlobaleType: devis.remiseGlobaleType,
      totalHT: devis.totalHT,
      totalRemise: devis.totalRemise,
      totalTva: devis.totalTva,
      totalTTC: devis.totalTTC,
      acompte: devis.acompte,
      acompteType: devis.acompteType,
      conditionsPaiement: devis.conditionsPaiement,
      delaiExecution: devis.delaiExecution,
      notes: devis.notes,
      mentionsLegales: devis.mentionsLegales,
    },
    client: {
      civilite: (devis.client as any).civilite,
      prenom: devis.client.prenom,
      nom: devis.client.nom,
      societe: devis.client.societe,
      type: devis.client.type,
      adresse: devis.client.adresse,
      codePostal: devis.client.codePostal,
      ville: devis.client.ville,
      telephone: devis.client.telephone,
      portable: devis.client.portable,
      email: devis.client.email,
    },
    lignes: devis.lignes.map((l) => ({
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
  }

  let buffer: Buffer

  // Si le devis est signé mais que l'upload Supabase avait échoué → génère à la volée
  const signatureSrc = devis.signatureClientUrl ?? devis.signatureClient ?? null
  if (
    devis.status === "SIGNE" &&
    signatureSrc &&
    devis.signatureClientNom &&
    devis.dateSignature &&
    devis.signatureToken
  ) {
    buffer = await generateSignedPdfBuffer(data, {
      signatureSrc,
      signatairenom: devis.signatureClientNom,
      dateSignature: devis.dateSignature,
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer = Buffer.from(await renderToBuffer(createElement(DevisPDF, data) as any))
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${devis.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
