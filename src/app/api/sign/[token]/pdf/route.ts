import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSignedPdfBuffer } from "@/lib/pdf/generate-signed-pdf"
import type { DevisPdfData } from "@/lib/pdf/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const devis = await prisma.devis.findUnique({
    where: { signatureToken: token },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      user: true,
    },
  })

  if (!devis) return NextResponse.json({ error: "Lien invalide" }, { status: 404 })

  if (devis.status !== "ACCEPTE") {
    return NextResponse.json({ error: "PDF non disponible" }, { status: 403 })
  }

  // Si le PDF signé est déjà archivé sur Supabase, rediriger directement
  if (devis.signedPdfUrl) {
    return NextResponse.redirect(devis.signedPdfUrl)
  }

  // Fallback : régénérer le PDF signé à la volée
  const appUrl = process.env.NEXTAUTH_URL ?? "https://devis-btp.fr"
  const verifyUrl = `${appUrl}/verify/${devis.signatureToken}`

  const pdfData: DevisPdfData = {
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
      civilite: devis.client.civilite,
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
    user: {
      companyName: devis.user.companyName,
      companyLogo: devis.user.companyLogo,
      companyAddress: devis.user.companyAddress,
      companyPostalCode: devis.user.companyPostalCode,
      companyCity: devis.user.companyCity,
      companyPhone: devis.user.companyPhone,
      companyEmail: devis.user.companyEmail,
      companySiret: devis.user.companySiret,
      companyTvaIntra: devis.user.companyTvaIntra,
      companyRcs: devis.user.companyRcs,
      companyFormeJuridique: devis.user.companyFormeJuridique,
      companyCapital: devis.user.companyCapital,
      assuranceNom: devis.user.assuranceNom,
      assuranceNumero: devis.user.assuranceNumero,
      couleurPrimaire: devis.user.couleurPrimaire,
    },
  }

  const buffer = await generateSignedPdfBuffer(pdfData, {
    signatureBase64: devis.signatureClient ?? "",
    signatairenom: devis.signatureClientNom ?? "",
    dateSignature: devis.dateSignature ?? new Date(),
    verifyUrl,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${devis.numero}-signe.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
