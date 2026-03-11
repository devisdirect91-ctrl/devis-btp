export type DevisPdfUser = {
  companyName?: string | null
  companyLogo?: string | null
  companyAddress?: string | null
  companyPostalCode?: string | null
  companyCity?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companySiret?: string | null
  companyTvaIntra?: string | null
  companyRcs?: string | null
  companyFormeJuridique?: string | null
  companyCapital?: string | null
  assuranceNom?: string | null
  assuranceNumero?: string | null
  couleurPrimaire?: string | null
}

export type DevisPdfClient = {
  civilite?: string | null
  prenom?: string | null
  nom: string
  societe?: string | null
  type: string
  adresse?: string | null
  codePostal?: string | null
  ville?: string | null
  telephone?: string | null
  portable?: string | null
  email?: string | null
}

export type DevisPdfLigne = {
  ligneType: string
  ordre: number
  designation: string
  description?: string | null
  quantite: number
  unite: string
  prixUnitaireHT: number
  remise: number
  tauxTva: number
  totalHtNet: number
  totalTTC: number
}

/** Informations de signature pour le PDF signé */
export type DevisPdfSignature = {
  /** Data URL (image/png) de la signature manuscrite */
  imageBase64: string
  /** Nom du signataire */
  signatairenom: string
  /** Horodatage exact */
  dateSignature: Date
  /** URL de la page de vérification */
  verifyUrl: string
  /** Data URL PNG du QR code */
  qrDataUrl: string
}

export type DevisPdfData = {
  devis: {
    numero: string
    titre: string
    status: string
    dateEmission: Date
    dateValidite?: Date | null
    adresseChantier?: string | null
    objetTravaux?: string | null
    dateDebutPrevisionnel?: Date | null
    remiseGlobale: number
    remiseGlobaleType: string
    totalHT: number
    totalRemise: number
    totalTva: number
    totalTTC: number
    acompte: number
    acompteType: string
    conditionsPaiement?: string | null
    delaiExecution?: string | null
    notes?: string | null
    mentionsLegales?: string | null
  }
  client: DevisPdfClient
  lignes: DevisPdfLigne[]
  user: DevisPdfUser
  /** Présent uniquement pour les PDFs signés */
  signature?: DevisPdfSignature | null
}
