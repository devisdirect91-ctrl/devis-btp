"use client"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "L'essai gratuit nécessite-t-il une carte bancaire ?",
    a: "Non, aucune carte bancaire n'est requise pour démarrer votre essai de 14 jours. Vous créez votre compte en 2 minutes et accédez immédiatement à toutes les fonctionnalités du plan Pro.",
  },
  {
    q: "Puis-je utiliser DevisBTP depuis mon téléphone sur le chantier ?",
    a: "Absolument. DevisBTP est conçu mobile-first. Vous pouvez créer, envoyer et suivre vos devis depuis n'importe quel smartphone ou tablette, même avec une connexion limitée.",
  },
  {
    q: "Comment puis-je résilier mon abonnement ?",
    a: "Vous pouvez résilier à tout moment depuis votre espace compte, sans frais ni pénalité. Vos devis restent accessibles en lecture pendant 12 mois après résiliation.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont hébergées en France, chiffrées et sauvegardées quotidiennement. Nous sommes conformes au RGPD et ne revendons jamais vos informations.",
  },
  {
    q: "Puis-je personnaliser mes devis avec mon logo ?",
    a: "Oui. Vous pouvez ajouter votre logo, choisir votre couleur de marque, et personnaliser les mentions légales, les conditions de paiement et les garanties sur chaque devis.",
  },
  {
    q: "Le catalogue BTP est-il vraiment pré-rempli ?",
    a: "Oui, le catalogue inclut des centaines de prestations par corps de métier : maçonnerie, plomberie, électricité, peinture, menuiserie, couverture… Vous pouvez aussi ajouter vos propres prestations.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
          style={{ background: open === i ? "#fff7ed" : "#fff" }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
          >
            <span className="font-semibold text-slate-900 text-sm md:text-base">{faq.q}</span>
            <ChevronDown
              className="w-5 h-5 flex-shrink-0 text-orange-500 transition-transform duration-300"
              style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: open === i ? "200px" : "0px" }}
          >
            <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
