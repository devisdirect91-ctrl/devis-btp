import { z } from "zod"

export const clientSchema = z.object({
  type: z.enum(["PARTICULIER", "PROFESSIONNEL"]),
  civilite: z.string().optional(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Adresse email invalide"
    ),
  telephone: z.string().optional(),
  portable: z.string().optional(),
  adresse: z.string().optional(),
  complement: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  // Professionnel
  societe: z.string().optional(),
  siret: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{14}$/.test(v.replace(/\s/g, "")),
      "Le SIRET doit contenir 14 chiffres"
    ),
  tvaIntra: z.string().optional(),
  rcs: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>
