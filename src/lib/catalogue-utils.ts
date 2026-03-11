export const CATEGORY_LABELS: Record<string, string> = {
  PLOMBERIE: "Plomberie",
  ELECTRICITE: "Électricité",
  MACONNERIE: "Maçonnerie / Gros œuvre",
  MENUISERIE: "Menuiserie",
  PEINTURE: "Peinture / Revêtements",
  CARRELAGE: "Carrelage",
  CHAUFFAGE: "Chauffage",
  CLIMATISATION: "Climatisation",
  COUVERTURE: "Toiture / Couverture",
  ISOLATION: "Isolation",
  PLATRERIE: "Plâtrerie",
  CHARPENTE: "Charpente / Bois",
  TERRASSEMENT: "Terrassement",
  VRD: "VRD",
  DEMOLITION: "Démolition",
  NETTOYAGE: "Nettoyage",
  MAIN_OEUVRE: "Main d'œuvre",
  FOURNITURES: "Fournitures",
  AUTRE: "Autre",
}

export const CATEGORY_COLORS: Record<string, string> = {
  PLOMBERIE: "bg-blue-100 text-blue-800 border-blue-200",
  ELECTRICITE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  MACONNERIE: "bg-stone-100 text-stone-800 border-stone-200",
  MENUISERIE: "bg-amber-100 text-amber-800 border-amber-200",
  PEINTURE: "bg-pink-100 text-pink-800 border-pink-200",
  CARRELAGE: "bg-cyan-100 text-cyan-800 border-cyan-200",
  CHAUFFAGE: "bg-orange-100 text-orange-800 border-orange-200",
  CLIMATISATION: "bg-sky-100 text-sky-800 border-sky-200",
  COUVERTURE: "bg-slate-100 text-slate-700 border-slate-200",
  ISOLATION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PLATRERIE: "bg-gray-100 text-gray-700 border-gray-200",
  CHARPENTE: "bg-lime-100 text-lime-800 border-lime-200",
  TERRASSEMENT: "bg-brown-100 text-brown-800 border-brown-200",
  VRD: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DEMOLITION: "bg-red-100 text-red-800 border-red-200",
  NETTOYAGE: "bg-teal-100 text-teal-800 border-teal-200",
  MAIN_OEUVRE: "bg-violet-100 text-violet-800 border-violet-200",
  FOURNITURES: "bg-rose-100 text-rose-800 border-rose-200",
  AUTRE: "bg-slate-100 text-slate-600 border-slate-200",
}

export const UNITE_LABELS: Record<string, string> = {
  UNITE: "u",
  HEURE: "h",
  JOUR: "j",
  METRE: "m",
  METRE_CARRE: "m²",
  METRE_CUBE: "m³",
  METRE_LINEAIRE: "ml",
  FORFAIT: "Forfait",
  ENSEMBLE: "Ens.",
  KILOGRAMME: "kg",
  TONNE: "t",
  LITRE: "L",
}

export const TVA_RATES = [
  { value: 20, label: "20 % — Taux normal" },
  { value: 10, label: "10 % — Taux intermédiaire (rénovation)" },
  { value: 5.5, label: "5,5 % — Taux réduit (performance énergétique)" },
]

// 29 prestations types BTP
export const SEED_CATALOG = [
  // PLOMBERIE
  { category: "PLOMBERIE", reference: "PLO001", designation: "Robinet mitigeur cuisine", description: "Fourniture et pose d'un robinet mitigeur cuisine (gamme standard)", unite: "UNITE", prixHT: 85, tauxTva: 10 },
  { category: "PLOMBERIE", reference: "PLO002", designation: "Chauffe-eau électrique 200 L", description: "Dépose ancien appareil, fourniture et pose chauffe-eau blindé 200 L + mise en service", unite: "UNITE", prixHT: 650, tauxTva: 10 },
  { category: "PLOMBERIE", reference: "PLO003", designation: "Débouchage canalisation", description: "Intervention par furet motorisé ou haute pression, dans un délai de 24 h", unite: "FORFAIT", prixHT: 180, tauxTva: 10 },
  { category: "PLOMBERIE", reference: "PLO004", designation: "WC suspendu avec bâti-support", description: "Fourniture et pose WC suspendu avec bâti Geberit (ou éq.), plaque de commande chromée", unite: "UNITE", prixHT: 490, tauxTva: 10 },
  // ELECTRICITE
  { category: "ELECTRICITE", reference: "ELE001", designation: "Prise de courant 2P+T encastrée", description: "Fourniture et pose prise de courant encastrée avec plaque de finition", unite: "UNITE", prixHT: 42, tauxTva: 10 },
  { category: "ELECTRICITE", reference: "ELE002", designation: "Tableau électrique principal", description: "Fourniture et pose tableau encastré avec coffret, disjoncteur diff. + divisionnaires, mise en service", unite: "FORFAIT", prixHT: 780, tauxTva: 10 },
  { category: "ELECTRICITE", reference: "ELE003", designation: "Point lumineux complet", description: "Fourniture et pose : boîte plafond, câblage, interrupteur, douille DCL", unite: "UNITE", prixHT: 75, tauxTva: 10 },
  { category: "ELECTRICITE", reference: "ELE004", designation: "Câblage réseau Cat6 par point", description: "Fourniture et pose câble réseau Cat6 S/FTP, prise RJ45 keystone incluse", unite: "UNITE", prixHT: 55, tauxTva: 20 },
  // MACONNERIE
  { category: "MACONNERIE", reference: "MAC001", designation: "Ragréage sol autolissant", description: "Application ragréage autolissant sur support sain et dépoussiéré, épaisseur ≤ 5 mm", unite: "METRE_CARRE", prixHT: 14, tauxTva: 10 },
  { category: "MACONNERIE", reference: "MAC002", designation: "Montage mur parpaings creux 20 cm", description: "Montage mur parpaings 20×20×50 cm, mortier bâtard, harponnage périphérique", unite: "METRE_CARRE", prixHT: 48, tauxTva: 10 },
  { category: "MACONNERIE", reference: "MAC003", designation: "Démolition cloison + évacuation", description: "Démolition cloison (brique ou carreaux plâtre), chargement et évacuation gravats en benne", unite: "METRE_CARRE", prixHT: 22, tauxTva: 10 },
  // MENUISERIE
  { category: "MENUISERIE", reference: "MEN001", designation: "Porte intérieure isoplane posée", description: "Fourniture et pose porte isoplane avec huisserie, joints, barre de seuil et poignée", unite: "UNITE", prixHT: 320, tauxTva: 10 },
  { category: "MENUISERIE", reference: "MEN002", designation: "Fenêtre PVC double vitrage", description: "Fourniture et pose fenêtre PVC 1 vantail DV 4/16/4 argon, appui filant béton inclus", unite: "UNITE", prixHT: 480, tauxTva: 5.5 },
  { category: "MENUISERIE", reference: "MEN003", designation: "Placard coulissant sur mesure", description: "Fourniture et pose placard coulissant 2 vantaux, caissons et tablettes mélaminés blanc", unite: "METRE_LINEAIRE", prixHT: 380, tauxTva: 10 },
  // PEINTURE
  { category: "PEINTURE", reference: "PEI001", designation: "Peinture murs intérieurs 2 couches", description: "Préparation support (rebouchage, ponçage), impression, 2 couches peinture vinylique", unite: "METRE_CARRE", prixHT: 15, tauxTva: 10 },
  { category: "PEINTURE", reference: "PEI002", designation: "Peinture façade 2 couches", description: "Nettoyage haute pression, rebouchage fissures, impression, 2 couches peinture façade acrylique", unite: "METRE_CARRE", prixHT: 28, tauxTva: 10 },
  { category: "PEINTURE", reference: "PEI003", designation: "Enduit de lissage 2 passes", description: "Application enduit de lissage en 2 passes sur murs et plafonds, ponçage et dépoussiérage", unite: "METRE_CARRE", prixHT: 18, tauxTva: 10 },
  // CARRELAGE
  { category: "CARRELAGE", reference: "CAR001", designation: "Carrelage sol 60×60 cm posé", description: "Préparation sol, colle flexible C2, pose carrelage grès cérame 60×60, joints époxy inclus", unite: "METRE_CARRE", prixHT: 48, tauxTva: 10 },
  { category: "CARRELAGE", reference: "CAR002", designation: "Faïence murale salle de bain", description: "Pose faïence murale 30×60, colle C1, joints ciment, hors niche et découpes complexes", unite: "METRE_CARRE", prixHT: 52, tauxTva: 10 },
  { category: "CARRELAGE", reference: "CAR003", designation: "Rejointoiement sol ou mur", description: "Dépose anciens joints détériorés, nettoyage, application joints ciment ou époxy", unite: "METRE_CARRE", prixHT: 15, tauxTva: 10 },
  // CHAUFFAGE
  { category: "CHAUFFAGE", reference: "CHA001", designation: "Radiateur à inertie 1500 W", description: "Fourniture et pose radiateur électrique à inertie sèche 1500 W avec thermostat intégré", unite: "UNITE", prixHT: 280, tauxTva: 5.5 },
  { category: "CHAUFFAGE", reference: "CHA002", designation: "Thermostat programmable connecté", description: "Fourniture et pose thermostat connecté (Netatmo ou éq.), câblage et configuration inclus", unite: "UNITE", prixHT: 145, tauxTva: 10 },
  // COUVERTURE
  { category: "COUVERTURE", reference: "COU001", designation: "Nettoyage toiture + traitement", description: "Brossage mécanique, démoussage chimique, application hydrofuge longue durée", unite: "METRE_CARRE", prixHT: 22, tauxTva: 10 },
  { category: "COUVERTURE", reference: "COU002", designation: "Remplacement tuile mécanique", description: "Dépose tuile cassée ou glissée, fourniture et repose tuile identique, joint silicone", unite: "UNITE", prixHT: 12, tauxTva: 10 },
  // ISOLATION
  { category: "ISOLATION", reference: "ISO001", designation: "Isolation combles perdus soufflée", description: "Fourniture et pose laine de verre soufflée R=7 en combles perdus, pare-vapeur inclus", unite: "METRE_CARRE", prixHT: 25, tauxTva: 5.5 },
  { category: "ISOLATION", reference: "ISO002", designation: "Isolation murs intérieurs (ITI)", description: "Fourniture et pose complexe isolant polystyrène expansé 100 mm + plaque plâtre BA13", unite: "METRE_CARRE", prixHT: 55, tauxTva: 5.5 },
  // MAIN_OEUVRE
  { category: "MAIN_OEUVRE", reference: "MDO001", designation: "Main d'œuvre à l'heure", description: "Taux horaire main d'œuvre toutes catégories — compagnon qualifié", unite: "HEURE", prixHT: 45, tauxTva: 20 },
  { category: "MAIN_OEUVRE", reference: "MDO002", designation: "Forfait déplacement", description: "Frais de déplacement aller-retour dans un rayon de 30 km autour du siège", unite: "FORFAIT", prixHT: 35, tauxTva: 20 },
  // FOURNITURES
  { category: "FOURNITURES", reference: "FOU001", designation: "Fournitures et consommables chantier", description: "Petites fournitures et consommables nécessaires à la réalisation (sur présentation des justificatifs)", unite: "FORFAIT", prixHT: 0, tauxTva: 20 },
]
