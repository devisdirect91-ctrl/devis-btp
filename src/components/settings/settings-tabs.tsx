"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, FileText, Settings2, Palette, User,
  Upload, X, Check, AlertCircle, Eye, EyeOff, Loader2,
} from "lucide-react"
import Image from "next/image"

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSettings {
  // Profil
  companyName?: string | null
  companyFormeJuridique?: string | null
  companyCapital?: string | null
  companySiret?: string | null
  companyApe?: string | null
  companyTvaIntra?: string | null
  companyRcs?: string | null
  companyAddress?: string | null
  companyPostalCode?: string | null
  companyCity?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companySiteWeb?: string | null
  companyLogo?: string | null
  // Mentions légales
  assuranceNom?: string | null
  assuranceNumero?: string | null
  assurancePeriode?: string | null
  assuranceCouverture?: string | null
  assuranceRcProNom?: string | null
  assuranceRcProNumero?: string | null
  mentionsLegalesDefaut?: string | null
  // Devis
  prefixeDevis?: string | null
  validiteDevisDefaut?: number | null
  conditionsPaiementDefaut?: string | null
  penalitesRetard?: string | null
  tauxTvaDefaut?: number | null
  messageFinDevis?: string | null
  // Personnalisation
  couleurPrimaire?: string | null
  // Compte
  name?: string | null
  email?: string | null
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 ${className}`}
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
    />
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
    >
      {saving ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
      ) : saved ? (
        <><Check className="w-4 h-4" /> Enregistré</>
      ) : (
        "Enregistrer"
      )}
    </button>
  )
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
        type === "success" ? "bg-emerald-600" : "bg-red-600"
      }`}
    >
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useSave(endpoint: string, method = "PATCH") {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const save = useCallback(
    async (data: object) => {
      setSaving(true)
      setSaved(false)
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Erreur")
        setSaved(true)
        showToast("Paramètres enregistrés", "success")
        setTimeout(() => setSaved(false), 3000)
      } catch (err: any) {
        showToast(err.message, "error")
      } finally {
        setSaving(false)
      }
    },
    [endpoint, method]
  )

  return { save, saving, saved, toast }
}

// ─── Tab 1: Profil entreprise ──────────────────────────────────────────────────

function TabProfil({ initial }: { initial: UserSettings }) {
  const [logo, setLogo] = useState(initial.companyLogo ?? "")
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    companyName: initial.companyName ?? "",
    companyFormeJuridique: initial.companyFormeJuridique ?? "",
    companyCapital: initial.companyCapital ?? "",
    companySiret: initial.companySiret ?? "",
    companyApe: initial.companyApe ?? "",
    companyTvaIntra: initial.companyTvaIntra ?? "",
    companyRcs: initial.companyRcs ?? "",
    companyAddress: initial.companyAddress ?? "",
    companyPostalCode: initial.companyPostalCode ?? "",
    companyCity: initial.companyCity ?? "",
    companyPhone: initial.companyPhone ?? "",
    companyEmail: initial.companyEmail ?? "",
    companySiteWeb: initial.companySiteWeb ?? "",
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const { save, saving, saved, toast } = useSave("/api/user/settings")
  const [uploadToast, setUploadToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const handleLogoUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/user/logo", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur upload")
      setLogo(json.url)
      setUploadToast({ message: "Logo mis à jour", type: "success" })
      setTimeout(() => setUploadToast(null), 3000)
    } catch (err: any) {
      setUploadToast({ message: err.message, type: "error" })
      setTimeout(() => setUploadToast(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      await fetch("/api/user/logo", { method: "DELETE" })
      setLogo("")
    } catch {}
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Logo de l'entreprise</h2>
        <div className="flex items-start gap-5">
          <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleLogoUpload(f)
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-slate-500" />
              )}
              {uploading ? "Upload en cours…" : "Choisir un logo"}
            </button>
            {logo && (
              <button
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Supprimer le logo
              </button>
            )}
            <p className="text-xs text-slate-400">JPG, PNG, WebP ou SVG — max 2 Mo</p>
          </div>
        </div>
      </div>

      {/* Identité */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Identité de l'entreprise</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'entreprise">
            <Input value={form.companyName} onChange={set("companyName")} placeholder="Bâti Pro SARL" />
          </Field>
          <Field label="Forme juridique">
            <Input value={form.companyFormeJuridique} onChange={set("companyFormeJuridique")} placeholder="SARL, SAS, EI…" />
          </Field>
          <Field label="Capital social">
            <Input value={form.companyCapital} onChange={set("companyCapital")} placeholder="10 000 €" />
          </Field>
          <Field label="SIRET">
            <Input value={form.companySiret} onChange={set("companySiret")} placeholder="12345678901234" />
          </Field>
          <Field label="Code APE / NAF">
            <Input value={form.companyApe} onChange={set("companyApe")} placeholder="4120A" />
          </Field>
          <Field label="N° TVA intracommunautaire">
            <Input value={form.companyTvaIntra} onChange={set("companyTvaIntra")} placeholder="FR12345678901" />
          </Field>
          <Field label="N° RCS">
            <Input value={form.companyRcs} onChange={set("companyRcs")} placeholder="Paris B 123 456 789" />
          </Field>
        </div>
      </div>

      {/* Coordonnées */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Adresse">
              <Input value={form.companyAddress} onChange={set("companyAddress")} placeholder="15 rue de la République" />
            </Field>
          </div>
          <Field label="Code postal">
            <Input value={form.companyPostalCode} onChange={set("companyPostalCode")} placeholder="75001" />
          </Field>
          <Field label="Ville">
            <Input value={form.companyCity} onChange={set("companyCity")} placeholder="Paris" />
          </Field>
          <Field label="Téléphone">
            <Input value={form.companyPhone} onChange={set("companyPhone")} placeholder="01 23 45 67 89" />
          </Field>
          <Field label="Email professionnel">
            <Input value={form.companyEmail} onChange={set("companyEmail")} type="email" placeholder="contact@monentreprise.fr" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Site web">
              <Input value={form.companySiteWeb} onChange={set("companySiteWeb")} placeholder="https://www.monentreprise.fr" />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={() => save(form)} />
      </div>

      {toast && <Toast {...toast} />}
      {uploadToast && <Toast {...uploadToast} />}
    </div>
  )
}

// ─── Tab 2: Mentions légales ───────────────────────────────────────────────────

function TabMentions({ initial }: { initial: UserSettings }) {
  const [form, setForm] = useState({
    assuranceNom: initial.assuranceNom ?? "",
    assuranceNumero: initial.assuranceNumero ?? "",
    assurancePeriode: initial.assurancePeriode ?? "",
    assuranceCouverture: initial.assuranceCouverture ?? "",
    assuranceRcProNom: initial.assuranceRcProNom ?? "",
    assuranceRcProNumero: initial.assuranceRcProNumero ?? "",
    mentionsLegalesDefaut: initial.mentionsLegalesDefaut ?? "",
  })
  const { save, saving, saved, toast } = useSave("/api/user/settings")
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Assurance décennale</h2>
        <p className="text-xs text-slate-400 mb-4">Obligatoire dans le BTP — apparaît sur les devis et factures</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'assureur">
            <Input value={form.assuranceNom} onChange={set("assuranceNom")} placeholder="AXA Construction" />
          </Field>
          <Field label="Numéro de police">
            <Input value={form.assuranceNumero} onChange={set("assuranceNumero")} placeholder="123456789" />
          </Field>
          <Field label="Période de couverture">
            <Input value={form.assurancePeriode} onChange={set("assurancePeriode")} placeholder="01/01/2024 - 31/12/2024" />
          </Field>
          <Field label="Zone de couverture">
            <Input value={form.assuranceCouverture} onChange={set("assuranceCouverture")} placeholder="France entière" />
          </Field>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Assurance RC Pro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'assureur RC Pro">
            <Input value={form.assuranceRcProNom} onChange={set("assuranceRcProNom")} placeholder="Generali Pro" />
          </Field>
          <Field label="Numéro de police RC Pro">
            <Input value={form.assuranceRcProNumero} onChange={set("assuranceRcProNumero")} placeholder="987654321" />
          </Field>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Mentions personnalisées</h2>
        <Field
          label="Mentions légales par défaut"
          hint="Ces mentions apparaissent en bas de chaque devis. Vous pouvez les modifier pour chaque devis individuellement."
        >
          <Textarea
            value={form.mentionsLegalesDefaut}
            onChange={set("mentionsLegalesDefaut")}
            placeholder="Ex : Travaux garantis 10 ans conformément à la loi Spinetta…"
            rows={5}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={() => save(form)} />
      </div>

      {toast && <Toast {...toast} />}
    </div>
  )
}

// ─── Tab 3: Paramètres devis ───────────────────────────────────────────────────

function TabDevis({ initial }: { initial: UserSettings }) {
  const [form, setForm] = useState({
    prefixeDevis: initial.prefixeDevis ?? "DEVIS",
    validiteDevisDefaut: String(initial.validiteDevisDefaut ?? 30),
    conditionsPaiementDefaut: initial.conditionsPaiementDefaut ?? "",
    penalitesRetard: initial.penalitesRetard ?? "",
    tauxTvaDefaut: String(initial.tauxTvaDefaut ?? 20),
    messageFinDevis: initial.messageFinDevis ?? "",
  })
  const { save, saving, saved, toast } = useSave("/api/user/settings")
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const handleSave = () =>
    save({
      prefixeDevis: form.prefixeDevis,
      validiteDevisDefaut: parseInt(form.validiteDevisDefaut) || 30,
      conditionsPaiementDefaut: form.conditionsPaiementDefaut,
      penalitesRetard: form.penalitesRetard,
      tauxTvaDefaut: parseFloat(form.tauxTvaDefaut) || 20,
      messageFinDevis: form.messageFinDevis,
    })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Numérotation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Préfixe des devis" hint={`Exemple : ${form.prefixeDevis || "DEVIS"}-2024-001`}>
            <Input value={form.prefixeDevis} onChange={set("prefixeDevis")} placeholder="DEVIS" />
          </Field>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Valeurs par défaut</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Durée de validité (jours)" hint="Nombre de jours avant expiration du devis">
            <Input
              value={form.validiteDevisDefaut}
              onChange={set("validiteDevisDefaut")}
              type="number"
              placeholder="30"
            />
          </Field>
          <Field label="Taux TVA par défaut (%)">
            <Input
              value={form.tauxTvaDefaut}
              onChange={set("tauxTvaDefaut")}
              type="number"
              placeholder="20"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Conditions de paiement par défaut"
              hint="Apparaissent sur chaque nouveau devis"
            >
              <Textarea
                value={form.conditionsPaiementDefaut}
                onChange={set("conditionsPaiementDefaut")}
                placeholder="Ex : 30% à la commande, solde à la réception des travaux"
                rows={3}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Pénalités de retard"
              hint="Clause pénalités appliquée en cas de retard de paiement"
            >
              <Textarea
                value={form.penalitesRetard}
                onChange={set("penalitesRetard")}
                placeholder="Ex : En cas de retard de paiement, des pénalités de 3 fois le taux légal seront appliquées…"
                rows={3}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Message de fin de devis"
              hint="Texte affiché avant la zone de signature"
            >
              <Textarea
                value={form.messageFinDevis}
                onChange={set("messageFinDevis")}
                placeholder="Ex : Pour accepter ce devis, veuillez le signer et le retourner accompagné d'un acompte de 30%."
                rows={3}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      {toast && <Toast {...toast} />}
    </div>
  )
}

// ─── Tab 4: Personnalisation ───────────────────────────────────────────────────

const PRESET_COLORS = [
  { label: "Bleu", value: "#1d4ed8" },
  { label: "Indigo", value: "#4338ca" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Rose", value: "#db2777" },
  { label: "Rouge", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Ambre", value: "#d97706" },
  { label: "Vert", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Slate", value: "#475569" },
  { label: "Noir", value: "#1e293b" },
]

function TabPersonnalisation({ initial }: { initial: UserSettings }) {
  const [couleur, setCouleur] = useState(initial.couleurPrimaire ?? "#1d4ed8")
  const { save, saving, saved, toast } = useSave("/api/user/settings")

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Couleur principale des devis</h2>
        <p className="text-xs text-slate-400 mb-5">
          Cette couleur est utilisée dans l'en-tête, les titres de section et les tableaux de vos devis.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-6 gap-3 mb-5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setCouleur(c.value)}
              className={`relative w-full aspect-square rounded-xl transition-all ${
                couleur === c.value ? "ring-2 ring-offset-2 ring-slate-700 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
            >
              {couleur === c.value && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>

        {/* Custom */}
        <Field label="Couleur personnalisée">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: couleur }}
            />
            <input
              type="color"
              value={couleur}
              onChange={(e) => setCouleur(e.target.value)}
              className="w-10 h-10 cursor-pointer rounded-lg border border-slate-200"
            />
            <input
              type="text"
              value={couleur}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCouleur(v)
              }}
              className="w-28 px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#1d4ed8"
            />
          </div>
        </Field>

        {/* Preview */}
        <div className="mt-6 rounded-xl overflow-hidden border border-slate-200">
          <div className="h-8 flex items-center px-4" style={{ backgroundColor: couleur }}>
            <span className="text-xs font-semibold text-white">DEVIS-2024-001 — Rénovation salle de bain</span>
          </div>
          <div className="p-4 bg-white">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-2 rounded bg-slate-100 w-3/4" />
                <div className="h-2 rounded bg-slate-100 w-1/2" />
              </div>
              <div
                className="px-3 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: couleur }}
              >
                12 500 €
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => save({ couleurPrimaire: couleur })}
        />
      </div>

      {toast && <Toast {...toast} />}
    </div>
  )
}

// ─── Tab 5: Compte ─────────────────────────────────────────────────────────────

function TabCompte({ initial }: { initial: UserSettings }) {
  const router = useRouter()

  // Password
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdError, setPwdError] = useState("")
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdToast, setPwdToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handlePasswordChange = async () => {
    setPwdError("")
    if (pwd.next !== pwd.confirm) {
      setPwdError("Les mots de passe ne correspondent pas")
      return
    }
    if (pwd.next.length < 8) {
      setPwdError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }
    setPwdSaving(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPwd({ current: "", next: "", confirm: "" })
      setPwdToast({ message: "Mot de passe modifié", type: "success" })
      setTimeout(() => setPwdToast(null), 3000)
    } catch (err: any) {
      setPwdError(err.message)
    } finally {
      setPwdSaving(false)
    }
  }

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleteError("")
    setDeleting(true)
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      router.push("/login")
    } catch (err: any) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Infos compte */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Informations du compte</h2>
        <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nom</span>
            <span className="font-medium text-slate-800">{initial.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-800">{initial.email}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Modifier le mot de passe</h2>
        <div className="space-y-3 max-w-sm">
          <Field label="Mot de passe actuel">
            <div className="relative">
              <Input
                value={pwd.current}
                onChange={(v) => setPwd((p) => ({ ...p, current: v }))}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Nouveau mot de passe">
            <Input
              value={pwd.next}
              onChange={(v) => setPwd((p) => ({ ...p, next: v }))}
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <Input
              value={pwd.confirm}
              onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))}
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
            />
          </Field>
          {pwdError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {pwdError}
            </p>
          )}
          <button
            onClick={handlePasswordChange}
            disabled={pwdSaving || !pwd.current || !pwd.next || !pwd.confirm}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pwdSaving ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Zone de danger</h2>
        <p className="text-xs text-slate-500 mb-4">
          La suppression de votre compte est irréversible. Toutes vos données (devis, clients, catalogue) seront définitivement effacées.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Supprimer mon compte</h3>
            <p className="text-sm text-slate-600">
              Cette action est <strong>irréversible</strong>. Tapez <code className="bg-slate-100 px-1 rounded text-red-600">SUPPRIMER</code> pour confirmer.
            </p>
            <Input
              value={deleteConfirm}
              onChange={setDeleteConfirm}
              placeholder="SUPPRIMER"
            />
            <Field label="Mot de passe">
              <Input
                value={deletePassword}
                onChange={setDeletePassword}
                type="password"
                placeholder="••••••••"
              />
            </Field>
            {deleteError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {deleteError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeletePassword(""); setDeleteError("") }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "SUPPRIMER" || deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pwdToast && <Toast {...pwdToast} />}
    </div>
  )
}

// ─── Main Tabs Component ───────────────────────────────────────────────────────

const TABS = [
  { id: "profil", label: "Profil entreprise", icon: Building2 },
  { id: "mentions", label: "Mentions légales", icon: FileText },
  { id: "devis", label: "Paramètres devis", icon: Settings2 },
  { id: "personnalisation", label: "Personnalisation", icon: Palette },
  { id: "compte", label: "Compte", icon: User },
] as const

type TabId = typeof TABS[number]["id"]

export function SettingsTabs({ user }: { user: UserSettings }) {
  const [active, setActive] = useState<TabId>("profil")

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar nav */}
      <nav className="lg:w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  active === tab.id
                    ? "bg-amber-50 text-amber-700 border-r-2 border-amber-500"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          {active === "profil" && <TabProfil initial={user} />}
          {active === "mentions" && <TabMentions initial={user} />}
          {active === "devis" && <TabDevis initial={user} />}
          {active === "personnalisation" && <TabPersonnalisation initial={user} />}
          {active === "compte" && <TabCompte initial={user} />}
        </div>
      </div>
    </div>
  )
}
