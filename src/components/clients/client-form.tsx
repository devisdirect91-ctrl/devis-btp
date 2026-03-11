"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { clientSchema, type ClientFormData } from "@/lib/validations/client"
import { AddressAutocomplete } from "@/components/clients/address-autocomplete"
import { User, Building2, Loader2, ChevronRight, Save } from "lucide-react"

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>
  clientId?: string // if set → edit mode
}

const EMPTY: ClientFormData = {
  type: "PARTICULIER",
  civilite: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  portable: "",
  adresse: "",
  complement: "",
  codePostal: "",
  ville: "",
  pays: "France",
  societe: "",
  siret: "",
  tvaIntra: "",
  rcs: "",
  notes: "",
}

type FieldErrors = Partial<Record<keyof ClientFormData, string>>

function InputField({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-200 focus:ring-blue-500"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 pt-2">
      <ChevronRight className="w-4 h-4 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{children}</h3>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

export function ClientForm({ defaultValues, clientId }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<ClientFormData>({ ...EMPTY, ...defaultValues })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const set = (field: keyof ClientFormData) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleAddressSelect = (data: { adresse: string; codePostal: string; ville: string }) => {
    setForm((f) => ({ ...f, adresse: data.adresse, codePostal: data.codePostal, ville: data.ville }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const result = clientSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ClientFormData
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    startTransition(async () => {
      const url = clientId ? `/api/clients/${clientId}` : "/api/clients"
      const method = clientId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || "Une erreur est survenue.")
        return
      }

      router.push(`/clients/${data.client.id}`)
      router.refresh()
    })
  }

  const isPro = form.type === "PROFESSIONNEL"

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {serverError}
        </div>
      )}

      {/* Type selector */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Type de client</p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {(["PARTICULIER", "PROFESSIONNEL"] as const).map((t) => {
            const Icon = t === "PARTICULIER" ? User : Building2
            const isActive = form.type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {t === "PARTICULIER" ? "Particulier" : "Professionnel"}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section Pro */}
      {isPro && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 space-y-4">
          <SectionTitle>Entreprise</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Raison sociale"
                value={form.societe || ""}
                onChange={set("societe")}
                error={errors.societe}
                required
                placeholder="Entreprise Martin SARL"
              />
            </div>
            <InputField
              label="N° SIRET"
              value={form.siret || ""}
              onChange={set("siret")}
              error={errors.siret}
              placeholder="XXX XXX XXX XXXXX"
            />
            <InputField
              label="N° TVA intracommunautaire"
              value={form.tvaIntra || ""}
              onChange={set("tvaIntra")}
              placeholder="FR XX XXXXXXXXX"
            />
            <InputField
              label="N° RCS"
              value={form.rcs || ""}
              onChange={set("rcs")}
              placeholder="RCS Paris B 123 456 789"
            />
          </div>
        </div>
      )}

      {/* Contact */}
      <div>
        <SectionTitle>Contact principal</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Civilité */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Civilité</label>
            <select
              value={form.civilite || ""}
              onChange={(e) => set("civilite")(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Non précisée</option>
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
            </select>
          </div>

          <div className="sm:col-span-1 hidden sm:block" /> {/* spacer */}

          <InputField
            label="Prénom"
            value={form.prenom || ""}
            onChange={set("prenom")}
            placeholder="Jean"
          />
          <InputField
            label="Nom"
            value={form.nom}
            onChange={set("nom")}
            error={errors.nom}
            required
            placeholder="Dupont"
          />
          <InputField
            label="Email"
            value={form.email || ""}
            onChange={set("email")}
            error={errors.email}
            type="email"
            placeholder="jean.dupont@exemple.fr"
          />
          <div /> {/* spacer */}
          <InputField
            label="Téléphone fixe"
            value={form.telephone || ""}
            onChange={set("telephone")}
            placeholder="01 23 45 67 89"
            type="tel"
          />
          <InputField
            label="Téléphone portable"
            value={form.portable || ""}
            onChange={set("portable")}
            placeholder="06 12 34 56 78"
            type="tel"
          />
        </div>
      </div>

      {/* Adresse */}
      <div>
        <SectionTitle>Adresse</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
            <AddressAutocomplete
              value={form.adresse || ""}
              onChange={set("adresse")}
              onSelect={handleAddressSelect}
              placeholder="12 rue de la Paix"
            />
          </div>
          <div className="sm:col-span-2">
            <InputField
              label="Complément d'adresse"
              value={form.complement || ""}
              onChange={set("complement")}
              placeholder="Bât. A, appartement 3, etc."
            />
          </div>
          <InputField
            label="Code postal"
            value={form.codePostal || ""}
            onChange={set("codePostal")}
            placeholder="75001"
          />
          <InputField
            label="Ville"
            value={form.ville || ""}
            onChange={set("ville")}
            placeholder="Paris"
          />
          <InputField
            label="Pays"
            value={form.pays || "France"}
            onChange={set("pays")}
            placeholder="France"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <SectionTitle>Notes internes</SectionTitle>
        <TextareaField
          label="Notes"
          value={form.notes || ""}
          onChange={set("notes")}
          placeholder="Informations complémentaires visibles uniquement par vous (conditions particulières, accès chantier, contacts secondaires…)"
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {clientId ? "Enregistrer les modifications" : "Créer le client"}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
