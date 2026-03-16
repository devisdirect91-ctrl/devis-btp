import { CheckCircle, HardHat, Star } from "lucide-react"
import { Barlow_Condensed } from "next/font/google"

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-barlow",
})

const BLUEPRINT_DOT = {
  backgroundImage:
    "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
  backgroundSize: "28px 28px",
}

interface AuthRightPanelProps {
  variant: "login" | "register"
}

const testimonials = {
  login: {
    quote:
      "Depuis que j'utilise BTPoche, je signe 30% de chantiers en plus. Mes devis partent le jour même, depuis mon téléphone.",
    name: "Sébastien M.",
    job: "Électricien — Paris",
    avatar: "SM",
    color: "bg-orange-500",
  },
  register: {
    quote:
      "En 5 minutes, j'avais un devis pro avec mon logo. Mes clients pensent que j'ai une secrétaire !",
    name: "Karim B.",
    job: "Plombier — Lyon",
    avatar: "KB",
    color: "bg-blue-500",
  },
}

const benefits = {
  login: [
    "Accédez à tous vos devis en un clic",
    "Suivez vos chantiers en temps réel",
    "Relancez vos clients au bon moment",
    "Gérez votre catalogue de prestations",
  ],
  register: [
    "Devis professionnel en 5 minutes",
    "Catalogue BTP pré-rempli par métier",
    "PDF avec votre logo et vos couleurs",
    "Envoi email en 1 clic depuis le chantier",
  ],
}

const stats = {
  login: [
    { value: "500+", label: "artisans actifs" },
    { value: "10 000+", label: "devis ce mois" },
    { value: "4,8/5", label: "note moyenne" },
  ],
  register: [
    { value: "14j", label: "essai gratuit" },
    { value: "5 min", label: "par devis" },
    { value: "0€", label: "sans carte" },
  ],
}

export function AuthRightPanel({ variant }: AuthRightPanelProps) {
  const t = testimonials[variant]
  const b = benefits[variant]
  const s = stats[variant]

  return (
    <div
      className={`${barlow.variable} hidden lg:flex flex-col justify-between bg-[#0a1628] relative overflow-hidden p-10 xl:p-14`}
      style={BLUEPRINT_DOT}
    >
      {/* Glow effects */}
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span
            className="font-black text-white text-xl tracking-tight"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            DEVIS<span className="text-orange-500">BTP</span>
          </span>
        </div>

        {/* Main headline */}
        <h2
          className="text-4xl xl:text-5xl font-black text-white leading-none mb-6"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          {variant === "login" ? (
            <>
              BON RETOUR
              <br />
              <span className="text-orange-500">SUR LE CHANTIER.</span>
            </>
          ) : (
            <>
              GAGNEZ DU TEMPS,
              <br />
              <span className="text-orange-500">SIGNEZ PLUS.</span>
            </>
          )}
        </h2>

        {/* Benefits */}
        <ul className="space-y-3 mb-10">
          {b.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-orange-500/15 border border-orange-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 text-orange-400" />
              </div>
              <span className="text-slate-300 text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {s.map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"
            >
              <p
                className="text-2xl font-black text-orange-400 leading-none mb-0.5"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          {/* Stars */}
          <div className="flex gap-1 mb-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
          </div>
          <blockquote className="text-slate-300 text-sm leading-relaxed mb-4 italic">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0`}
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              {t.avatar}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{t.name}</p>
              <p className="text-slate-500 text-xs">{t.job}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
