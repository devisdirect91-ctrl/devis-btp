import { z } from "zod"

export const factureLigneSchema = z.object({
  ligneType: z.enum(["LINE", "SECTION"]),
  ordre: z.number(),
  designation: z.string(),
  description: z.string().optional(),
  quantite: z.number().min(0),
  unite: z.string(),
  prixUnitaireHT: z.number().min(0),
  remise: z.number().min(0).max(100),
  tauxTva: z.number().min(0),
  totalHT: z.number(),
  totalRemise: z.number(),
  totalHtNet: z.number(),
  totalTva: z.number(),
  totalTTC: z.number(),
})

export const factureSchema = z.object({
  numero: z.string().min(1, "Numéro requis"),
  clientId: z.string().min(1, "Client requis"),
  dateEmission: z.string().min(1, "Date d'émission requise"),
  dateEcheance: z.string().min(1, "Date d'échéance requise"),
  conditionsPaiement: z.string().optional(),
  notes: z.string().optional(),
  mentionsLegales: z.string().optional(),
  lignes: z.array(factureLigneSchema),
})

export type FacturePayload = z.infer<typeof factureSchema>
