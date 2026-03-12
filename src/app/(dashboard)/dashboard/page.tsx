import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Clock,
  Banknote,
  CheckCircle,
  Eye,
  Copy,
  FileDown,
  FilePlus,
  ArrowRight,
  HardHat,
} from "lucide-react";
import { clientDisplayName } from "@/lib/client-utils"
import { StatusBadge } from "@/components/devis/status-badge";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [devisCeMois, devisEnvoyes, devisAcceptes, devisRefuses, montantAccepteAgg, recentDevis] =
    userId
      ? await Promise.all([
          prisma.devis.count({ where: { userId, dateEmission: { gte: startOfMonth } } }),
          prisma.devis.count({ where: { userId, status: "ENVOYE" } }),
          prisma.devis.count({ where: { userId, status: "ACCEPTE" } }),
          prisma.devis.count({ where: { userId, status: "REFUSE" } }),
          prisma.devis.aggregate({ where: { userId, status: "ACCEPTE" }, _sum: { totalTTC: true } }),
          prisma.devis.findMany({ where: { userId }, include: { client: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        ])
      : [0, 0, 0, 0, { _sum: { totalTTC: 0 } }, []];

  const montantAccepte = (montantAccepteAgg as { _sum: { totalTTC: number | null } })._sum.totalTTC ?? 0;

  const firstName = session?.user?.name?.split(" ")[0] ?? "vous";

  const stats = [
    {
      label: "Devis ce mois",
      value: devisCeMois,
      suffix: "",
      sub: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Devis acceptés",
      value: devisAcceptes,
      suffix: "",
      sub: devisAcceptes === 0 ? "Aucun devis accepté" : `devis accepté${devisAcceptes > 1 ? "s" : ""}`,
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    {
      label: "Montant accepté",
      value: montantAccepte.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
      suffix: "",
      sub: `${devisAcceptes} devis accepté${devisAcceptes > 1 ? "s" : ""}`,
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    {
      label: "En attente de réponse",
      value: devisEnvoyes,
      suffix: "",
      sub: devisEnvoyes === 0 ? "Aucun devis en attente" : "devis envoyés sans réponse",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Voici un résumé de votre activité
          </p>
        </div>
        <Link
          href="/devis/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          Nouveau devis
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white rounded-xl p-5 border ${stat.border} shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-xl font-semibold text-slate-600">{stat.suffix}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 truncate">{stat.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0 ml-3`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent devis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Derniers devis</h2>
          </div>
          <Link
            href="/devis"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Voir tout
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentDevis.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">Aucun devis pour le moment</p>
            <p className="text-sm text-slate-400 mt-1">
              Créez votre premier devis pour commencer
            </p>
            <Link
              href="/devis/nouveau"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <FilePlus className="w-4 h-4" />
              Créer un devis
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {recentDevis.map((devis) => (
                <Link
                  key={devis.id}
                  href={`/devis/${devis.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-4 active:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {devis.numero}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 text-sm truncate">{devis.titre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{clientDisplayName(devis.client)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(devis.dateEmission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {devis.totalTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                    <StatusBadge devisId={devis.id} status={devis.status} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Numéro
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Client / Objet
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Montant TTC
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Statut
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentDevis.map((devis) => (
                    <tr
                      key={devis.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {devis.numero}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 text-sm">{devis.titre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{clientDisplayName(devis.client)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(devis.dateEmission).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {devis.totalTTC.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge devisId={devis.id} status={devis.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/devis/${devis.id}`}
                            title="Voir le devis"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/devis/${devis.id}/dupliquer`}
                            title="Dupliquer"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </Link>
                          {devis.pdfUrl ? (
                            <a
                              href={devis.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Télécharger le PDF"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              title="PDF non disponible"
                              disabled
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-200 cursor-not-allowed"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
