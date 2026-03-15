import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { SignaturePage } from "@/components/signature/SignaturePage"

interface Props {
  params: Promise<{ token: string }>
}

async function logOpen(devisId: string, ip: string | null, userAgent: string | null) {
  await prisma.signatureLog.create({
    data: { devisId, action: "OUVERT", ipAddress: ip, userAgent },
  })
}

export default async function SignerPage({ params }: Props) {
  const { token } = await params

  const devis = await prisma.devis.findUnique({
    where: { signatureToken: token },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      user: true,
    },
  })

  if (!devis) notFound()

  // Expiry check
  const expired = devis.dateValidite && new Date() > new Date(devis.dateValidite)

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Lien expiré</h1>
          <p className="text-slate-500 text-sm">
            Ce lien de signature a expiré. Contactez l&apos;entreprise pour obtenir un nouveau devis.
          </p>
        </div>
      </div>
    )
  }

  // Log OUVERT si pas encore traité
  if (devis.status !== "SIGNE" && devis.status !== "REFUSE") {
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
    const userAgent = h.get("user-agent") ?? null

    // Run in background (don't block render)
    void logOpen(devis.id, ip, userAgent)
  }

  return (
    <SignaturePage
      token={token}
      devis={{
        id: devis.id,
        numero: devis.numero,
        titre: devis.titre,
        status: devis.status,
        dateEmission: devis.dateEmission.toISOString(),
        dateValidite: devis.dateValidite?.toISOString() ?? null,
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
        dateSignature: devis.dateSignature?.toISOString() ?? null,
      }}
      client={{
        civilite: devis.client.civilite,
        prenom: devis.client.prenom,
        nom: devis.client.nom,
        societe: devis.client.societe,
        type: devis.client.type,
        adresse: devis.client.adresse,
        codePostal: devis.client.codePostal,
        ville: devis.client.ville,
        telephone: devis.client.telephone,
        email: devis.client.email,
      }}
      lignes={devis.lignes.map((l) => ({
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
      }))}
      user={{
        companyName: devis.user.companyName,
        companyLogo: devis.user.companyLogo,
        companyAddress: devis.user.companyAddress,
        companyPostalCode: devis.user.companyPostalCode,
        companyCity: devis.user.companyCity,
        companyPhone: devis.user.companyPhone,
        companyEmail: devis.user.companyEmail,
        companySiret: devis.user.companySiret,
        couleurPrimaire: devis.user.couleurPrimaire,
      }}
    />
  )
}
