import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
    include: {
      acomptes: { select: { montant: true } },
      client: { select: { email: true, nom: true, prenom: true, societe: true } },
      user: { select: { companyName: true } },
    },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  if (facture.status === "PAYEE" || facture.status === "ANNULEE") {
    return NextResponse.json({ error: "Cette facture ne peut plus recevoir de paiement" }, { status: 422 })
  }

  const body = await req.json()
  const { montant, datePaiement, modePaiement, reference, notes, envoyerRecu } = body

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
  }
  if (!datePaiement) return NextResponse.json({ error: "Date de paiement requise" }, { status: 400 })
  if (!modePaiement) return NextResponse.json({ error: "Mode de paiement requis" }, { status: 400 })

  const totalDejaRecu = facture.acomptes.reduce((s, a) => s + a.montant, 0)
  const resteAPayer = Math.round((facture.totalTTC - totalDejaRecu) * 100) / 100

  if (montant > resteAPayer + 0.001) {
    return NextResponse.json({ error: `Le montant dépasse le reste à percevoir (${resteAPayer} €)` }, { status: 400 })
  }

  const nouveauTotal = Math.round((totalDejaRecu + montant) * 100) / 100
  const newStatus = nouveauTotal >= facture.totalTTC - 0.01 ? "PAYEE" : "PARTIELLEMENT_PAYEE"

  const [acompte] = await prisma.$transaction([
    prisma.acompte.create({
      data: {
        factureId: id,
        montant,
        datePaiement: new Date(datePaiement),
        modePaiement,
        reference: reference?.trim() || null,
        notes: notes?.trim() || null,
      },
    }),
    prisma.facture.update({
      where: { id },
      data: {
        montantPaye: nouveauTotal,
        status: newStatus,
        ...(newStatus === "PAYEE" ? {
          datePaiement: new Date(datePaiement),
          modePaiement,
        } : {}),
      },
    }),
  ])

  // Envoi du reçu par email si demandé et facture soldée
  if (envoyerRecu && newStatus === "PAYEE" && facture.client.email) {
    const clientNom = facture.client.societe || [facture.client.prenom, facture.client.nom].filter(Boolean).join(" ")
    const dateFormatted = new Date(datePaiement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    const montantFormatted = facture.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

    try {
      await sendEmail({
        to: facture.client.email,
        subject: `Reçu de paiement — ${facture.numero}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
            <div style="background:#059669;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">✓</div>
              <h1 style="margin:0;font-size:20px">Paiement reçu</h1>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px">Bonjour ${clientNom},</p>
              <p style="margin:0 0 16px">Nous confirmons la réception de votre règlement pour la facture <strong>${facture.numero}</strong>.</p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr><td style="padding:4px 0;color:#64748b">Facture</td><td style="text-align:right;font-weight:600">${facture.numero}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b">Date de paiement</td><td style="text-align:right">${dateFormatted}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b">Mode</td><td style="text-align:right">${modePaiement}</td></tr>
                  ${reference ? `<tr><td style="padding:4px 0;color:#64748b">Référence</td><td style="text-align:right">${reference}</td></tr>` : ""}
                  <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0 4px;font-weight:700;font-size:16px">Montant total réglé</td><td style="text-align:right;font-weight:700;font-size:16px;color:#059669">${montantFormatted}</td></tr>
                </table>
              </div>
              <p style="margin:0;color:#64748b;font-size:13px">Cordialement,<br><strong>${facture.user.companyName ?? "DevisBTP"}</strong></p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.warn("[paiement] Email reçu non envoyé:", e)
    }
  }

  return NextResponse.json({ acompte, status: newStatus }, { status: 201 })
}
