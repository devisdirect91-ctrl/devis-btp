import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

function getBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

function clientDisplayName(client: {
  type: string
  societe?: string | null
  civilite?: string | null
  prenom?: string | null
  nom: string
}): string {
  if (client.type === "PROFESSIONNEL" && client.societe) return client.societe
  return [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ")
}

// GET — Prépare les données d'envoi (crée le token si absent)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  let devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  // Crée le token de signature si absent
  if (!devis.signatureToken) {
    devis = await prisma.devis.update({
      where: { id },
      data: { signatureToken: randomUUID() },
      include: { client: true },
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true, companyPhone: true, companyEmail: true },
  })

  const base = getBaseUrl()

  return NextResponse.json({
    signatureToken: devis.signatureToken,
    signatureUrl: `${base}/signer/${devis.signatureToken}`,
    pdfUrl: `${base}/api/devis/${id}/pdf`,
    clientEmail: devis.client.email ?? "",
    clientName: clientDisplayName(devis.client as any),
    companyName: user?.companyName ?? "",
    companyPhone: user?.companyPhone ?? "",
    companyEmail: user?.companyEmail ?? "",
    devisNumero: devis.numero,
    devisTitre: devis.titre,
    totalTTC: devis.totalTTC,
    dateValidite: devis.dateValidite?.toISOString() ?? null,
  })
}

// POST — Marque le devis comme envoyé
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const devis = await prisma.devis.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

  // Passe en ENVOYE seulement si BROUILLON ou déjà ENVOYE (ré-envoi)
  if (devis.status === "BROUILLON" || devis.status === "ENVOYE") {
    await prisma.devis.update({
      where: { id },
      data: {
        status: "ENVOYE",
        dateEnvoi: new Date(),
      },
    })
  }

  return NextResponse.json({ success: true })
}
