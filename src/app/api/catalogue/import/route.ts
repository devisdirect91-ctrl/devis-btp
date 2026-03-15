import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { catalogueSchema } from "@/lib/validations/catalogue"

const VALID_CATEGORIES = new Set([
  "MACONNERIE", "PLATRERIE", "CARRELAGE", "PEINTURE", "PLOMBERIE", "ELECTRICITE",
  "MENUISERIE", "CHARPENTE", "COUVERTURE", "ISOLATION", "CHAUFFAGE", "CLIMATISATION",
  "TERRASSEMENT", "VRD", "DEMOLITION", "NETTOYAGE", "MAIN_OEUVRE", "FOURNITURES", "AUTRE",
])

const VALID_UNITES = new Set([
  "UNITE", "HEURE", "JOUR", "METRE", "METRE_CARRE", "METRE_CUBE",
  "METRE_LINEAIRE", "FORFAIT", "ENSEMBLE", "KILOGRAMME", "TONNE", "LITRE",
])

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const text = await req.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) {
    return NextResponse.json({ error: "Fichier CSV vide ou invalide" }, { status: 400 })
  }

  const [headerLine, ...dataLines] = lines
  const headers = parseCsvLine(headerLine).map((h) => h.toLowerCase())

  const idx = {
    reference: headers.indexOf("reference"),
    category: headers.findIndex((h) => h === "categorie" || h === "category"),
    designation: headers.indexOf("designation"),
    description: headers.indexOf("description"),
    unite: headers.indexOf("unite"),
    prixHT: headers.findIndex((h) => h === "prixht" || h === "prix_ht"),
    tauxTva: headers.findIndex((h) => h === "tauxtva" || h === "taux_tva"),
  }

  if (idx.designation < 0 || idx.category < 0) {
    return NextResponse.json({ error: "Colonnes 'designation' et 'categorie' obligatoires" }, { status: 400 })
  }

  const toCreate = []
  const errors: string[] = []

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCsvLine(dataLines[i])
    const lineNum = i + 2

    const category = (cols[idx.category] || "").toUpperCase()
    const unite = (cols[idx.unite] || "UNITE").toUpperCase()

    if (!VALID_CATEGORIES.has(category)) {
      errors.push(`Ligne ${lineNum} : catégorie "${category}" invalide`)
      continue
    }
    if (!VALID_UNITES.has(unite)) {
      errors.push(`Ligne ${lineNum} : unité "${unite}" invalide`)
      continue
    }

    const row = {
      reference: idx.reference >= 0 ? cols[idx.reference] || null : null,
      category,
      designation: cols[idx.designation] || "",
      description: idx.description >= 0 ? cols[idx.description] || null : null,
      unite,
      prixHT: parseFloat(cols[idx.prixHT] || "0") || 0,
      tauxTva: parseFloat(cols[idx.tauxTva] || "20") || 20,
    }

    const result = catalogueSchema.safeParse(row)
    if (!result.success) {
      errors.push(`Ligne ${lineNum} : ${result.error.issues[0].message}`)
      continue
    }

    toCreate.push({ ...row, category: category as any, unite: unite as any, userId: session.user.id })
  }

  if (toCreate.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide à importer", errors }, { status: 400 })
  }

  const created = await prisma.catalogItem.createMany({ data: toCreate })

  return NextResponse.json({ created: created.count, errors, total: dataLines.length })
}
