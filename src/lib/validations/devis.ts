import { z } from "zod"

export const ligneSchema = z.object({
  ligneType: z.enum(["LINE", "SECTION"]),
  ordre: z.number(),
  designation: z.string(),
  description: z.string().optional(),
  quantite: z.number().min(0),
  unite: z.string(),
  prixUnitaireHT: z.number().min(0),
  remise: z.number().min(0).max(100),
  tauxTva: z.number().min(0),
  catalogItemId: z.string().nullish(),
  totalHT: z.number(),
  totalRemise: z.number(),
  totalHtNet: z.number(),
  totalTva: z.number(),
  totalTTC: z.number(),
})

export const devisSchema = z.object({
  numero: z.string().min(1, "Numéro requis"),
  titre: z.string().min(1, "Objet du devis requis"),
  clientId: z.string().min(1, "Client requis"),
  dateEmission: z.string(),
  validiteJours: z.number().min(1),
  adresseChantier: z.string().optional(),
  objetTravaux: z.string().optional(),
  dateDebutPrevisionnel: z.string().nullish(),
  remiseGlobale: z.number().min(0),
  remiseGlobaleType: z.enum(["PERCENT", "AMOUNT"]),
  acompte: z.number().min(0),
  acompteType: z.enum(["PERCENT", "AMOUNT"]),
  conditionsPaiement: z.string().optional(),
  delaiExecution: z.string().optional(),
  notes: z.string().optional(),
  mentionsLegales: z.string().optional(),
  lignes: z.array(ligneSchema),
})

export type DevisPayload = z.infer<typeof devisSchema>
