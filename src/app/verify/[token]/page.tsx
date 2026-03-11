import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CheckCircle, XCircle, Clock, ShieldCheck, Building2, FileText, Calendar, User } from "lucide-react"

interface Props {
  params: Promise<{ token: string }>
}

function fmtDatetime(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export default async function VerifyPage({ params }: Props) {
  const { token } = await params

  const devis = await prisma.devis.findUnique({
    where: { signatureToken: token },
    select: {
      numero: true,
      titre: true,
      status: true,
      dateEmission: true,
      dateSignature: true,
      signatureClientNom: true,
      signatureClientIp: true,
      signatureUserAgent: true,
      user: {
        select: {
          companyName: true,
          companyAddress: true,
          companyPostalCode: true,
          companyCity: true,
          couleurPrimaire: true,
        },
      },
      client: {
        select: {
          nom: true,
          prenom: true,
          societe: true,
          type: true,
          civilite: true,
        },
      },
    },
  })

  if (!devis) notFound()

  const primary = devis.user.couleurPrimaire ?? "#1d4ed8"
  const isSigned = devis.status === "ACCEPTE"
  const isRefused = devis.status === "REFUSE"

  const clientName = devis.client.type === "PROFESSIONNEL" && devis.client.societe
    ? devis.client.societe
    : [devis.client.civilite, devis.client.prenom, devis.client.nom].filter(Boolean).join(" ")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ backgroundColor: primary }}
            >
              {devis.user.companyName?.slice(0, 2).toUpperCase() ?? "DB"}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{devis.user.companyName ?? "Entreprise"}</p>
              <p className="text-xs text-slate-500">Vérification de document</p>
            </div>
            <div className="ml-auto">
              <ShieldCheck className="w-5 h-5 text-slate-300" />
            </div>
          </div>

          {/* Status banner */}
          <div className={`px-6 py-5 ${
            isSigned
              ? "bg-emerald-50 border-b border-emerald-100"
              : isRefused
              ? "bg-red-50 border-b border-red-100"
              : "bg-slate-50 border-b border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              {isSigned ? (
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
              ) : isRefused ? (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-slate-400" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900 text-base">
                  {isSigned
                    ? "Document signé électroniquement"
                    : isRefused
                    ? "Devis refusé"
                    : "Signature en attente"}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isSigned
                    ? `Signé le ${fmtDatetime(devis.dateSignature)}`
                    : isRefused
                    ? `Refusé le ${fmtDatetime(devis.dateSignature)}`
                    : "Ce devis n'a pas encore été signé"}
                </p>
              </div>
            </div>
          </div>

          {/* Devis details */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex justify-between flex-1">
                <span className="text-slate-500">Référence</span>
                <span className="font-mono font-semibold text-slate-900">{devis.numero}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-transparent flex-shrink-0" />
              <div className="flex justify-between flex-1">
                <span className="text-slate-500">Objet</span>
                <span className="font-medium text-slate-900 text-right max-w-56 truncate">{devis.titre}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex justify-between flex-1">
                <span className="text-slate-500">Émetteur</span>
                <span className="font-medium text-slate-900">{devis.user.companyName ?? "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex justify-between flex-1">
                <span className="text-slate-500">Destinataire</span>
                <span className="font-medium text-slate-900">{clientName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex justify-between flex-1">
                <span className="text-slate-500">Émis le</span>
                <span className="text-slate-900">{fmtDate(devis.dateEmission)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proof card (only for signed) */}
        {isSigned && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <h2 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Preuve de signature électronique
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Signataire</span>
                <span className="font-semibold text-slate-900">{devis.signatureClientNom || clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Horodatage</span>
                <span className="font-medium text-slate-900">{fmtDatetime(devis.dateSignature)}</span>
              </div>
              {devis.signatureClientIp && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Adresse IP</span>
                  <span className="font-mono text-slate-700 text-xs">{devis.signatureClientIp}</span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conformément à l&apos;article 1367 du Code civil, cette signature électronique a valeur juridique de signature manuscrite. Ce document constitue un engagement contractuel entre les parties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Ce lien de vérification est unique et permanent · DevisBTP
        </p>
      </div>
    </div>
  )
}
