import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { sendEmail, emailSignatureConfirmationClient, emailSignatureNotificationArtisan } from "@/lib/email"
import { generateSignedPdfBuffer, uploadSignedPdf } from "@/lib/pdf/generate-signed-pdf"
import { uploadSignatureBase64 } from "@/lib/supabase"
import type { DevisPdfData } from "@/lib/pdf/types"

async function getDevisByToken(token: string) {
  return prisma.devis.findUnique({
    where: { signatureToken: token },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      user: true,
    },
  })
}

function buildPdfData(devis: Awaited<ReturnType<typeof getDevisByToken>>): DevisPdfData {
  if (!devis) throw new Error("devis null")
  return {
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
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const devis = await getDevisByToken(token)

  if (!devis) return NextResponse.json({ error: "Lien invalide" }, { status: 404 })

  if (devis.dateValidite && new Date() > new Date(devis.dateValidite)) {
    return NextResponse.json({ error: "Ce lien a expiré", expired: true }, { status: 410 })
  }

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
  const userAgent = h.get("user-agent") ?? null

  if (devis.status !== "SIGNE" && devis.status !== "SIGNE_ELECTRONIQUEMENT" && devis.status !== "REFUSE" && devis.status !== "REFUSE_ELECTRONIQUEMENT") {
    await prisma.signatureLog.create({
      data: { devisId: devis.id, action: "OUVERT", ipAddress: ip, userAgent },
    })
  }

  const clientName = devis.client.type === "PROFESSIONNEL" && devis.client.societe
    ? devis.client.societe
    : [devis.client.civilite, devis.client.prenom, devis.client.nom].filter(Boolean).join(" ")

  return NextResponse.json({
    devis: {
      id: devis.id,
      numero: devis.numero,
      titre: devis.titre,
      status: devis.status,
      dateEmission: devis.dateEmission,
      dateValidite: devis.dateValidite,
      totalHT: devis.totalHT,
      totalRemise: devis.totalRemise,
      totalTva: devis.totalTva,
      totalTTC: devis.totalTTC,
      remiseGlobale: devis.remiseGlobale,
      remiseGlobaleType: devis.remiseGlobaleType,
      acompte: devis.acompte,
      acompteType: devis.acompteType,
      conditionsPaiement: devis.conditionsPaiement,
      delaiExecution: devis.delaiExecution,
      notes: devis.notes,
      mentionsLegales: devis.mentionsLegales,
      signatureClient: devis.signatureClient,
      signatureClientUrl: devis.signatureClientUrl,
      signatureClientNom: devis.signatureClientNom,
      dateSignature: devis.dateSignature,
    },
    client: { ...devis.client, displayName: clientName },
    lignes: devis.lignes,
    user: {
      companyName: devis.user.companyName,
      companyLogo: devis.user.companyLogo,
      companyAddress: devis.user.companyAddress,
      companyPostalCode: devis.user.companyPostalCode,
      companyCity: devis.user.companyCity,
      companyPhone: devis.user.companyPhone,
      companyEmail: devis.user.companyEmail,
      companySiret: devis.user.companySiret,
      couleurPrimaire: devis.user.couleurPrimaire,
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const devis = await getDevisByToken(token)

  if (!devis) return NextResponse.json({ error: "Lien invalide" }, { status: 404 })

  if (devis.dateValidite && new Date() > new Date(devis.dateValidite)) {
    return NextResponse.json({ error: "Ce lien a expiré" }, { status: 410 })
  }

  if (devis.status === "SIGNE" || devis.status === "SIGNE_ELECTRONIQUEMENT" || devis.status === "REFUSE" || devis.status === "REFUSE_ELECTRONIQUEMENT") {
    return NextResponse.json({ error: "Ce devis a déjà été traité" }, { status: 409 })
  }

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
  const userAgent = h.get("user-agent") ?? null

  const body = await req.json()
  const { action, nom, signatureBase64, acceptedTerms, motif } = body

  if (action !== "SIGNE" && action !== "REFUSE") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  }
  if (action === "SIGNE" && !signatureBase64) {
    return NextResponse.json({ error: "Signature requise" }, { status: 400 })
  }
  if (action === "SIGNE" && !acceptedTerms) {
    return NextResponse.json({ error: "Vous devez accepter les conditions" }, { status: 400 })
  }

  const dateSignature = new Date()

  // Upload de la signature vers Supabase Storage (hors DB)
  let signatureClientUrl: string | null = null
  if (action === "SIGNE" && signatureBase64) {
    try {
      signatureClientUrl = await uploadSignatureBase64(devis.userId, devis.id, signatureBase64)
    } catch (err) {
      console.error("[sign] upload signature error:", err)
      // Non-fatal : fallback sur stockage base64 en DB
    }
  }

  await prisma.devis.update({
    where: { id: devis.id },
    data: {
      status: action === "SIGNE" ? "SIGNE_ELECTRONIQUEMENT" : "REFUSE_ELECTRONIQUEMENT",
      dateSignature,
      signatureClientNom: nom || null,
      // Si l'upload Storage a réussi → on stocke uniquement l'URL, pas le base64
      signatureClient: signatureClientUrl ? null : (signatureBase64 || null),
      signatureClientUrl: signatureClientUrl ?? null,
      signatureClientIp: ip,
      signatureUserAgent: userAgent,
      ...(action === "REFUSE" ? { motifRefus: motif?.trim() || null } : {}),
    },
  })

  await prisma.signatureLog.create({
    data: {
      devisId: devis.id,
      action: action,
      ipAddress: ip,
      userAgent,
      metadata: { nom, acceptedTerms, ...(action === "REFUSE" && motif ? { motif } : {}) },
    },
  })

  // ── PDF signé + emails (non-blocking) ──────────────────────────────────────
  const clientName = devis.client.type === "PROFESSIONNEL" && devis.client.societe
    ? devis.client.societe
    : [devis.client.prenom, devis.client.nom].filter(Boolean).join(" ")
  const artisanNom = devis.user.companyName ?? devis.user.name ?? "L'entreprise"
  const appUrl = process.env.NEXTAUTH_URL ?? "https://btpoche-eight.vercel.app"

  void (async () => {
    try {
      let pdfBuffer: Buffer | null = null

      if (action === "SIGNE" && signatureBase64) {
        const pdfData = buildPdfData(devis)

        pdfBuffer = await generateSignedPdfBuffer(pdfData, {
          signatureSrc: signatureClientUrl ?? signatureBase64,
          signatairenom: nom || clientName,
          dateSignature,
        })

        // Upload vers Supabase Storage
        try {
          const pdfUrl = await uploadSignedPdf(devis.userId, devis.id, devis.numero, pdfBuffer)
          await prisma.devis.update({ where: { id: devis.id }, data: { signedPdfUrl: pdfUrl } })
        } catch (uploadErr) {
          console.error("[sign] upload PDF error:", uploadErr)
          // Non-fatal : le PDF reste générable à la volée
        }
      }

      // Email au client (confirmation + PDF en pièce jointe)
      if (action === "SIGNE" && devis.client.email) {
        await sendEmail({
          to: devis.client.email,
          subject: `Confirmation de signature — Devis ${devis.numero}`,
          html: emailSignatureConfirmationClient({
            devisNumero: devis.numero,
            devisTitre: devis.titre,
            totalTTC: devis.totalTTC,
            clientNom: clientName,
            artisanNom,
            artisanPhone: devis.user.companyPhone,
            artisanEmail: devis.user.companyEmail,
            dateSignature,
            signatairenom: nom || clientName,
          }),
          attachments: pdfBuffer
            ? [{ filename: `${devis.numero}-signe.pdf`, content: pdfBuffer }]
            : undefined,
        })
      }

      // Notification à l'artisan
      if (devis.user.email) {
        await sendEmail({
          to: devis.user.email,
          subject: action === "SIGNE"
            ? `✅ Devis ${devis.numero} accepté par ${clientName}`
            : `❌ Devis ${devis.numero} refusé par ${clientName}`,
          html: emailSignatureNotificationArtisan({
            devisNumero: devis.numero,
            devisTitre: devis.titre,
            totalTTC: devis.totalTTC,
            clientNom: clientName,
            action,
            dateSignature,
            signatairenom: nom || clientName,
            motifRefus: action === "REFUSE" ? motif?.trim() || null : undefined,
          }),
        })
      }
    } catch (e) {
      console.error("[sign] post-signature error:", e)
    }
  })()

  return NextResponse.json({ success: true, action })
}
