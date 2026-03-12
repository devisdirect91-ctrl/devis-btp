import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

function clientPrenom(client: {
  type: string
  societe?: string | null
  prenom?: string | null
  nom: string
}): string {
  if (client.type === "PROFESSIONNEL" && client.societe) return client.societe
  return client.prenom ?? client.nom
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

  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: true,
      tokens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      companyName: true,
      companyPhone: true,
      companyEmail: true,
    },
  })

  // Crée un token valable 90 jours
  const token = await prisma.factureToken.create({
    data: {
      factureId: id,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })

  const base = getBaseUrl()

  return NextResponse.json({
    token: token.token,
    consultationUrl: `${base}/facture/${token.token}`,
    pdfUrl: `${base}/api/facture/${token.token}/pdf`,
    clientEmail: facture.client.email ?? "",
    clientName: clientDisplayName(facture.client as any),
    clientPrenom: clientPrenom(facture.client as any),
    companyName: user?.companyName ?? "",
    companyPhone: user?.companyPhone ?? "",
    companyEmail: user?.companyEmail ?? "",
    factureNumero: facture.numero,
    totalTTC: facture.totalTTC,
    dateEcheance: facture.dateEcheance.toISOString(),
    conditionsPaiement: facture.conditionsPaiement ?? "",
  })
}

// POST — Marque la facture comme envoyée
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const facture = await prisma.facture.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  await prisma.facture.update({
    where: { id },
    data: { dateEnvoi: new Date() },
  })

  return NextResponse.json({ success: true })
}
