import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

async function main() {
  // 1. Trouver un utilisateur existant
  const user = await db.user.findFirst({
    select: { id: true, email: true, companyName: true, companyPhone: true, companyEmail: true },
  })

  if (!user) {
    console.error("❌ Aucun utilisateur trouvé. Créez d'abord un compte via http://localhost:3000/register")
    return
  }
  console.log(`ℹ️  Utilisateur : ${user.email} (${user.companyName ?? "sans entreprise"})`)

  // 2. Trouver ou créer un client de test
  let client = await db.client.findFirst({
    where: { userId: user.id },
    select: { id: true, nom: true, prenom: true },
  })

  if (!client) {
    client = await db.client.create({
      data: {
        userId: user.id,
        nom: "Dupont",
        prenom: "Jean",
        civilite: "M.",
        type: "PARTICULIER",
        email: "client.test@example.fr",
        telephone: "06 98 76 54 32",
        adresse: "5 allée des Roses",
        codePostal: "69001",
        ville: "Lyon",
      },
    })
    console.log(`✅ Client créé : ${client.prenom} ${client.nom}`)
  } else {
    console.log(`ℹ️  Client : ${client.prenom ?? ""} ${client.nom}`)
  }

  // 3. Créer un devis de test
  const year = new Date().getFullYear()
  const last = await db.devis.findFirst({
    where: { userId: user.id, numeroAnnee: year },
    orderBy: { numeroSequence: "desc" },
    select: { numeroSequence: true },
  })
  const seq = (last?.numeroSequence ?? 0) + 1
  const numero = `DEVIS-${year}-${String(seq).padStart(3, "0")}`
  const token = crypto.randomUUID()

  const dateValidite = new Date()
  dateValidite.setDate(dateValidite.getDate() + 30)

  const devis = await db.devis.create({
    data: {
      numero,
      numeroAnnee: year,
      numeroSequence: seq,
      titre: "Rénovation salle de bain — TEST",
      status: "ENVOYE",
      signatureToken: token,
      validiteJours: 30,
      dateEmission: new Date(),
      dateEnvoi: new Date(),
      dateValidite,
      conditionsPaiement: "30% à la commande, solde à la réception",
      delaiExecution: "3 semaines",
      notes: "Devis de test pour validation du système de signature.",
      userId: user.id,
      clientId: client.id,
      totalHT: 2500,
      totalRemise: 0,
      totalTva: 500,
      totalTTC: 3000,
      acompte: 30,
      acompteType: "PERCENT",
      lignes: {
        create: [
          {
            ligneType: "LINE",
            ordre: 1,
            designation: "Dépose ancien carrelage",
            description: "Dépose et évacuation des gravats",
            quantite: 12,
            unite: "METRE_CARRE",
            prixUnitaireHT: 25,
            remise: 0,
            tauxTva: 20,
            totalHT: 300,
            totalRemise: 0,
            totalHtNet: 300,
            totalTva: 60,
            totalTTC: 360,
          },
          {
            ligneType: "LINE",
            ordre: 2,
            designation: "Fourniture et pose carrelage 60×60",
            description: "Carrelage grès cérame, format 60×60, coloris blanc",
            quantite: 12,
            unite: "METRE_CARRE",
            prixUnitaireHT: 95,
            remise: 0,
            tauxTva: 20,
            totalHT: 1140,
            totalRemise: 0,
            totalHtNet: 1140,
            totalTva: 228,
            totalTTC: 1368,
          },
          {
            ligneType: "LINE",
            ordre: 3,
            designation: "Faïence murale",
            description: "Pose faïence murale jusqu'à 2m de hauteur",
            quantite: 20,
            unite: "METRE_CARRE",
            prixUnitaireHT: 53,
            remise: 0,
            tauxTva: 20,
            totalHT: 1060,
            totalRemise: 0,
            totalHtNet: 1060,
            totalTva: 212,
            totalTTC: 1272,
          },
        ],
      },
    },
  })

  console.log("\n✅ Devis de test créé !")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`📄 Numéro          : ${devis.numero}`)
  console.log(`💰 Total TTC       : 3 000,00 €  (acompte 30% = 900 €)`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`🔗 Page signature  : http://localhost:3000/signer/${token}`)
  console.log(`🏠 Dashboard       : http://localhost:3000/devis/${devis.id}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
