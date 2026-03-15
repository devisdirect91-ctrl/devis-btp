import { z } from "zod"

export const catalogueSchema = z.object({
  reference: z.string().optional(),
  category: z.enum([
    "MACONNERIE", "PLATRERIE", "CARRELAGE", "PEINTURE", "PLOMBERIE",
    "ELECTRICITE", "MENUISERIE", "CHARPENTE", "COUVERTURE", "ISOLATION",
    "CHAUFFAGE", "CLIMATISATION", "TERRASSEMENT", "VRD", "DEMOLITION",
    "NETTOYAGE", "MAIN_OEUVRE", "FOURNITURES", "AUTRE",
  ]),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  unite: z.enum([
    "UNITE", "HEURE", "JOUR", "METRE", "METRE_CARRE", "METRE_CUBE",
    "METRE_LINEAIRE", "FORFAIT", "ENSEMBLE", "KILOGRAMME", "TONNE", "LITRE",
  ]),
  prixHT: z.number().min(0, "Le prix ne peut pas être négatif"),
  tauxTva: z.number(),
})

export type CatalogueFormData = z.infer<typeof catalogueSchema>
