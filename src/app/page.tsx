import Link from "next/link"
import { Barlow_Condensed, DM_Sans } from "next/font/google"
import {
  Zap, BookOpen, Calculator, FileText, Mail, BarChart2,
  CheckCircle, ArrowRight, Star, HardHat, Phone, Menu,
  Clock, AlertTriangle, TrendingDown, Shield, Users, Smartphone,
} from "lucide-react"
import { FAQ } from "@/components/landing/FAQ"

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"], variable: "--font-barlow" })
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dm" })

/* ── helpers ─────────────────────────────────────────────────────────── */
const BP = "bg-[#0a1628]"
const BLUEPRINT_DOT = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
  backgroundSize: "28px 28px",
}

export default function LandingPage() {
  return (
    <main className={`${barlow.variable} ${dmSans.variable} overflow-x-hidden`} style={{ fontFamily: "var(--font-dm)" }}>

      {/* ══ NAV ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-lg tracking-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              DEVIS<span className="text-orange-500">BTP</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Fonctionnalités", "Tarifs", "Témoignages", "FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors font-medium">
              Connexion
            </Link>
            <Link href="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/25">
              Essai gratuit
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className={`${BP} min-h-screen pt-16 relative overflow-hidden`} style={BLUEPRINT_DOT}>
        {/* Orange diagonal accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-900/60 hidden lg:block" />
        <div className="absolute top-0 right-0 w-px h-full bg-orange-500/20 hidden lg:block" style={{ right: "50%", transform: "skewX(-3deg)" }} />

        {/* Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 lg:pt-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-400 text-xs font-semibold tracking-wide uppercase">Nouveau — Essai 14 jours gratuit</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.92] mb-6 tracking-tight"
                style={{ fontFamily: "var(--font-barlow)" }}>
                CRÉEZ VOS<br />
                <span className="text-orange-500">DEVIS BTP</span><br />
                EN 5 MINUTES.
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                Fini les devis sur papier ou les tableaux Excel interminables.
                Créez des devis <strong className="text-white">professionnels et signés</strong> depuis
                votre téléphone, même sur le chantier.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link href="/register"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/30 text-base">
                  Démarrer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#fonctionnalités"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-2xl transition-all text-base">
                  Voir une démo
                  <span className="text-orange-500">▶</span>
                </a>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Annulation libre</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Données en France</span>
              </div>
            </div>

            {/* Right — App Mockup */}
            <div className="relative lg:flex justify-center hidden">
              <div className="relative w-full max-w-md">
                {/* Phone frame */}
                <div className="bg-slate-800 rounded-3xl p-2 shadow-2xl shadow-black/50 border border-white/10">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-[#0a1628] px-4 pt-3 pb-2 flex items-center justify-between">
                      <span className="text-white text-xs font-bold" style={{ fontFamily: "var(--font-barlow)" }}>DEVIS<span className="text-orange-500">BTP</span></span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-orange-500/25 rounded-full" />
                      </div>
                    </div>
                    {/* Devis card */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">DEVIS-2024-047</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Accepté ✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Rénovation salle de bain</p>
                        <p className="text-xs text-slate-500">M. Dupont — Paris 15e</p>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: "Dépose ancienne baignoire", prix: "320 €" },
                          { label: "Pose douche à l'italienne", prix: "1 840 €" },
                          { label: "Carrelage sol + murs", prix: "2 100 €" },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                            <span className="text-slate-700">{item.label}</span>
                            <span className="font-semibold text-slate-900">{item.prix}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#0a1628] rounded-xl p-3 flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-medium">Total TTC</span>
                        <span className="text-white font-black text-lg" style={{ fontFamily: "var(--font-barlow)" }}>5 120 €</span>
                      </div>
                      <button className="w-full bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Envoyer par email
                      </button>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 border border-slate-100">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Devis signé !</p>
                    <p className="text-[10px] text-slate-500">il y a 2 minutes</p>
                  </div>
                </div>
                {/* Floating badge 2 */}
                <div className="absolute -top-4 -right-4 bg-orange-500 text-white rounded-2xl shadow-xl px-3 py-2">
                  <p className="text-xs font-black" style={{ fontFamily: "var(--font-barlow)" }}>⚡ 4 MIN 32 SEC</p>
                  <p className="text-[10px] opacity-80">Temps de création</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-100" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ══ TRUST STRIP ═════════════════════════════════════════════════ */}
      <section className="bg-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Déjà rejoints par <span className="text-orange-500">500+ artisans</span> en France
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {[
              { name: "PlombPro", icon: "🔧" },
              { name: "ÉlecBat", icon: "⚡" },
              { name: "MaçonSud", icon: "🧱" },
              { name: "PeintureXL", icon: "🎨" },
              { name: "CouvreurIDF", icon: "🏠" },
              { name: "MenuisNord", icon: "🪵" },
            ].map((co) => (
              <div key={co.name} className="flex items-center gap-2">
                <span className="text-xl">{co.icon}</span>
                <span className="font-black text-slate-700 text-sm" style={{ fontFamily: "var(--font-barlow)" }}>{co.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROBLÈME ════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28" id="fonctionnalités">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">Le problème</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              VOUS PERDEZ DU TEMPS<br />ET DES CHANTIERS.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                color: "bg-red-50 text-red-500",
                border: "border-red-100",
                title: "Des heures perdues sur Excel",
                desc: "Recalculer la TVA, corriger les formules, mettre en forme… Vous passez plus de temps sur le devis que sur le chantier.",
              },
              {
                icon: AlertTriangle,
                color: "bg-amber-50 text-amber-500",
                border: "border-amber-100",
                title: "Des devis qui font amateur",
                desc: "Un devis manuscrit ou mal formaté, et le client choisit un concurrent. La première impression, c'est votre devis.",
              },
              {
                icon: TrendingDown,
                color: "bg-slate-100 text-slate-500",
                border: "border-slate-200",
                title: "Des devis qui dorment sans réponse",
                desc: "Vous envoyez un devis et vous attendez. Sans relance, sans suivi, les chantiers filent entre vos mains.",
              },
            ].map((pain, i) => {
              const Icon = pain.icon
              return (
                <div key={i} className={`border ${pain.border} rounded-3xl p-7 relative overflow-hidden group hover:shadow-lg transition-shadow`}>
                  <div className={`w-12 h-12 ${pain.color} rounded-2xl flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl mb-3" style={{ fontFamily: "var(--font-barlow)" }}>
                    {pain.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{pain.desc}</p>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-tl-full" />
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <p className="text-2xl font-black text-orange-500" style={{ fontFamily: "var(--font-barlow)" }}>
              DevisBTP résout ces 3 problèmes. →
            </p>
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ═════════════════════════════════════════════ */}
      <section className={`${BP} py-20 sm:py-28 relative`} style={BLUEPRINT_DOT}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-transparent to-[#0a1628]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              TOUT CE QU&apos;IL VOUS FAUT,<br />RIEN DE SUPERFLU.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Création en 5 minutes",
                desc: "Interface pensée pour mobile. Ajoutez vos prestations en quelques taps, depuis le chantier.",
                accent: "text-orange-500",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                icon: BookOpen,
                title: "Catalogue BTP pré-rempli",
                desc: "Centaines de prestations par métier : plomberie, électricité, maçonnerie, peinture, toiture.",
                accent: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: Calculator,
                title: "Calcul TVA automatique",
                desc: "TVA à 20%, 10% (rénovation) ou 5.5% (performance énergétique) calculée automatiquement.",
                accent: "text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                icon: FileText,
                title: "PDF avec votre logo",
                desc: "Vos devis aux couleurs de votre entreprise. Logo, couleur, mentions légales personnalisés.",
                accent: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
              },
              {
                icon: Mail,
                title: "Envoi email en 1 clic",
                desc: "Envoyez le PDF directement depuis l'appli. Le client reçoit un email professionnel immédiatement.",
                accent: "text-cyan-400",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                icon: BarChart2,
                title: "Suivi en temps réel",
                desc: "Voyez quels devis sont en attente, acceptés ou refusés. Relancez au bon moment.",
                accent: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
            ].map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className={`border ${feat.bg} rounded-2xl p-6 hover:bg-white/5 transition-colors group`}>
                  <div className={`w-10 h-10 ${feat.bg} border rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feat.accent}`} />
                  </div>
                  <h3 className={`font-black text-white text-xl mb-2 ${feat.accent}`} style={{ fontFamily: "var(--font-barlow)" }}>
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ═══════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">Simple comme bonjour</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              3 ÉTAPES POUR<br />VOTRE PREMIER DEVIS.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200" />
            {[
              {
                num: "01",
                icon: Smartphone,
                title: "Créez votre compte",
                desc: "2 minutes chrono. Renseignez votre entreprise, ajoutez votre logo. C'est parti.",
              },
              {
                num: "02",
                icon: Users,
                title: "Ajoutez client & prestations",
                desc: "Sélectionnez un client, choisissez vos prestations dans le catalogue BTP. Les prix se calculent tout seuls.",
              },
              {
                num: "03",
                icon: Mail,
                title: "Envoyez le PDF",
                desc: "Un devis professionnel à votre image, envoyé par email en 1 clic. Suivez la réponse en temps réel.",
              },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-white border-2 border-orange-500/20 rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <step.icon className="w-8 h-8 text-orange-500" />
                  </div>
                  <span className="absolute -top-3 -right-3 text-5xl font-black z-0 select-none"
                    style={{ fontFamily: "var(--font-barlow)", color: "rgba(249,115,22,0.12)" }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/30 text-base">
              Créer mon premier devis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TARIFS ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28" id="tarifs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              TRANSPARENT.<br />SANS SURPRISE.
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-12 mx-auto flex justify-center w-fit">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-sm font-semibold">Essai 14 jours gratuit sur tous les plans</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: "Gratuit",
                price: "0€",
                period: "/mois",
                desc: "Pour démarrer et tester",
                features: ["3 devis par mois", "1 client", "PDF basique", "Support email"],
                cta: "Démarrer",
                featured: false,
              },
              {
                name: "Pro",
                price: "29€",
                period: "/mois",
                desc: "Pour l'artisan actif",
                features: ["Devis illimités", "Clients illimités", "Catalogue BTP complet", "PDF avec logo & couleurs", "Envoi email intégré", "Relances automatiques", "Suivi des statuts"],
                cta: "Choisir Pro",
                featured: true,
              },
              {
                name: "Entreprise",
                price: "79€",
                period: "/mois",
                desc: "Pour les équipes",
                features: ["Tout du plan Pro", "5 utilisateurs", "Multi-sites", "Statistiques avancées", "Export comptable", "Support prioritaire"],
                cta: "Contacter",
                featured: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`rounded-3xl p-7 relative overflow-hidden ${
                plan.featured
                  ? "bg-[#0a1628] text-white shadow-2xl shadow-slate-900/30 scale-105"
                  : "border border-slate-200 bg-white"
              }`}>
                {plan.featured && (
                  <>
                    <div className="absolute inset-0" style={BLUEPRINT_DOT} />
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">⭐ Populaire</span>
                    </div>
                  </>
                )}
                <div className="relative">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.featured ? "text-orange-400" : "text-slate-400"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-5xl font-black leading-none ${plan.featured ? "text-white" : "text-slate-900"}`}
                      style={{ fontFamily: "var(--font-barlow)" }}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-1 ${plan.featured ? "text-slate-400" : "text-slate-400"}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm mb-6 ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? "text-orange-400" : "text-green-500"}`} />
                        <span className={plan.featured ? "text-slate-300" : "text-slate-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.featured
                        ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ═════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-28" id="témoignages">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">Témoignages</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              ILS GAGNENT DU TEMPS,<br />ILS SIGNENT PLUS.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: "Karim B.",
                job: "Plombier",
                city: "Lyon",
                avatar: "KB",
                color: "bg-blue-600",
                stars: 5,
                quote: "Avant je perdais 2h par devis sur Excel. Maintenant c'est 5 minutes sur mon téléphone, même entre deux interventions. Mes clients voient la différence.",
              },
              {
                name: "Sébastien M.",
                job: "Électricien",
                city: "Paris",
                avatar: "SM",
                color: "bg-orange-500",
                stars: 5,
                quote: "J'ai signé 30% de chantiers en plus depuis que mes devis sont propres et envoyés dans la journée. Le suivi des statuts m'évite d'oublier de relancer.",
              },
              {
                name: "Patrick D.",
                job: "Maçon",
                city: "Marseille",
                avatar: "PD",
                color: "bg-emerald-600",
                stars: 5,
                quote: "Simple, rapide, professionnel. Le catalogue BTP est top, j'ai juste à sélectionner mes prestations. Je recommande à tous les artisans.",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-600 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0`}
                    style={{ fontFamily: "var(--font-barlow)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.job} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
              VOS QUESTIONS,<br />NOS RÉPONSES.
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════════════════ */}
      <section className={`${BP} py-24 sm:py-32 relative overflow-hidden`} style={BLUEPRINT_DOT}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a1628]/80" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-8">
            <HardHat className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-semibold">Rejoignez 500+ artisans qui font confiance à DevisBTP</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-none" style={{ fontFamily: "var(--font-barlow)" }}>
            PRÊT À SIGNER<br />
            <span className="text-orange-500">PLUS DE CHANTIERS ?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Créez votre compte en 2 minutes. Aucune carte bancaire requise. Annulable à tout moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl transition-all shadow-2xl shadow-orange-500/40 text-lg"
              style={{ fontFamily: "var(--font-barlow)" }}>
              COMMENCER GRATUITEMENT
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+33123456789"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-2xl transition-all text-base">
              <Phone className="w-4 h-4" />
              Parler à un conseiller
            </a>
          </div>
          <p className="text-slate-600 text-sm mt-6 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" />14 jours gratuits</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" />Sans carte bancaire</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" />Résiliation libre</span>
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#060d1a] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <HardHat className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-white text-lg" style={{ fontFamily: "var(--font-barlow)" }}>
                  DEVIS<span className="text-orange-500">BTP</span>
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                La solution de création de devis pensée pour les artisans du bâtiment.
              </p>
              <div className="flex gap-3">
                {["f", "in", "tw"].map((s) => (
                  <a key={s} href="#" className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors text-xs font-bold">
                    {s}
                  </a>
                ))}
              </div>
            </div>
            {[
              {
                title: "Produit",
                links: ["Fonctionnalités", "Tarifs", "Changelog", "Roadmap"],
              },
              {
                title: "Ressources",
                links: ["Blog", "Guides BTP", "Centre d'aide", "API"],
              },
              {
                title: "Légal",
                links: ["CGU", "Politique de confidentialité", "Mentions légales", "Contact"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-white font-bold text-xs uppercase tracking-widest mb-4" style={{ fontFamily: "var(--font-barlow)" }}>
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-600 text-xs">
              © 2024 DevisBTP. Tous droits réservés.
            </p>
            <p className="text-slate-600 text-xs">
              Made with ❤️ pour les artisans de France
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
