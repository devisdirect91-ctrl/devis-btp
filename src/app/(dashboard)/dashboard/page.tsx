import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Receipt,
  UserPlus,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  XCircle,
  HardHat,
  FilePlus,
  ArrowRight,
  Eye,
  Copy,
  FileDown,
  Banknote,
} from "lucide-react";
import { clientDisplayName } from "@/lib/client-utils";
import { StatusBadge } from "@/components/devis/status-badge";

async function getStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    caThisMonth,
    caLastMonth,
    facturesTotal,
    facturesPayees,
    facturesTotaux,
    devisAcceptes,
    devisEnAttente,
    devisRefuses,
    lastDevis,
  ] = await Promise.all([
    // CA ce mois = somme des acomptes encaissés ce mois
    prisma.acompte.aggregate({
      where: { facture: { userId }, datePaiement: { gte: startOfMonth } },
      _sum: { montant: true },
    }),
    // CA mois dernier = somme des acomptes encaissés le mois passé
    prisma.acompte.aggregate({
      where: {
        facture: { userId },
        datePaiement: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { montant: true },
    }),
    prisma.facture.count({ where: { userId, status: { not: "BROUILLON" } } }),
    prisma.facture.count({ where: { userId, status: "PAYEE" } }),
    // Totaux pour le pourcentage et montant encaissé global
    prisma.facture.aggregate({
      where: { userId, status: { not: "BROUILLON" } },
      _sum: { totalTTC: true, montantPaye: true },
    }),
    prisma.devis.count({ where: { userId, status: "SIGNE" } }),
    prisma.devis.count({ where: { userId, status: "EN_ATTENTE" } }),
    prisma.devis.count({ where: { userId, status: "REFUSE" } }),
    prisma.devis.findMany({
      where: { userId },
      include: { client: { select: { nom: true, prenom: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const ca = caThisMonth._sum.montant ?? 0;
  const caLast = caLastMonth._sum.montant ?? 0;
  const evolution = caLast > 0 ? Math.round(((ca - caLast) / caLast) * 100) : 0;

  const totalDu = facturesTotaux._sum.totalTTC ?? 0;
  const montantEncaisse = facturesTotaux._sum.montantPaye ?? 0;
  const montantRestant = Math.max(0, totalDu - montantEncaisse);
  const pourcentageFacturesPayees =
    totalDu > 0 ? Math.round((montantEncaisse / totalDu) * 100) : 0;

  return {
    chiffreAffaires: ca,
    evolution,
    facturesTotal,
    facturesPayees,
    pourcentageFacturesPayees,
    montantEncaisse,
    montantRestant,
    devisAcceptes,
    devisEnAttente,
    devisRefuses,
    lastDevis,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const stats = await getStats(userId);
  const firstName = session.user.name?.split(" ")[0] ?? "vous";

  // Desktop : stats complémentaires
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [devisCeMois, devisEnvoyesTotal, montantAccepteAgg, recentDevisDesktop] =
    await Promise.all([
      prisma.devis.count({ where: { userId, dateEmission: { gte: startOfMonth } } }),
      prisma.devis.count({ where: { userId, status: "EN_ATTENTE" } }),
      prisma.devis.aggregate({
        where: { userId, status: "SIGNE" },
        _sum: { totalTTC: true },
      }),
      prisma.devis.findMany({
        where: { userId },
        select: {
          id: true,
          numero: true,
          titre: true,
          dateEmission: true,
          totalTTC: true,
          status: true,
          pdfUrl: true,
          client: { select: { nom: true, prenom: true, societe: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const montantAccepte = montantAccepteAgg._sum.totalTTC ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─────────────── VERSION MOBILE ─────────────── */}
      <div className="md:hidden pb-24">
        {/* Actions rapides */}
        <section className="px-4 py-6">
          <div className="flex justify-center gap-8">
            <QuickAction
              href="/devis/nouveau"
              icon={FileText}
              label="Devis"
              gradient="from-orange-400 to-orange-600"
              shadow="shadow-orange-200"
              plusColor="text-orange-500"
            />
            <QuickAction
              href="/factures/nouveau"
              icon={Receipt}
              label="Facture"
              gradient="from-blue-400 to-blue-600"
              shadow="shadow-blue-200"
              plusColor="text-blue-500"
            />
            <QuickAction
              href="/clients/new"
              icon={UserPlus}
              label="Client"
              gradient="from-green-400 to-green-600"
              shadow="shadow-green-200"
              plusColor="text-green-500"
            />
          </div>
        </section>

        {/* Chiffre d'affaires */}
        <section className="px-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Chiffre d&apos;affaires</p>
                <p className="text-3xl font-bold mt-1">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(stats.chiffreAffaires)}
                </p>
                <p className="text-gray-400 text-xs mt-1">Ce mois</p>
              </div>
              <div className="bg-white/10 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            {stats.evolution !== 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                {stats.evolution >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      +{stats.evolution}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      {stats.evolution}%
                    </span>
                  </>
                )}
                <span className="text-gray-400 text-sm">vs mois dernier</span>
              </div>
            )}
          </div>
        </section>

        {/* Factures payées – jauge circulaire */}
        <section className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-5 border">
            <div className="flex items-center gap-5">
              <CircularProgress value={stats.pourcentageFacturesPayees} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Encaissements</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(stats.montantEncaisse)}{" "}
                  encaissés
                </p>
                {stats.montantRestant > 0 && (
                  <p className="text-sm text-orange-500 mt-0.5">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(stats.montantRestant)}{" "}
                    en attente
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Statut des devis */}
        <section className="px-4 mt-4">
          <p className="text-sm font-semibold text-gray-500 mb-3">Mes devis</p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              value={stats.devisAcceptes}
              label="Acceptés"
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              value={stats.devisEnAttente}
              label="En attente"
              icon={Clock}
              color="yellow"
            />
            <StatCard
              value={stats.devisRefuses}
              label="Refusés"
              icon={XCircle}
              color="red"
            />
          </div>
        </section>

        {/* Derniers devis */}
        <section className="px-4 mt-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-500">Récemment</p>
            <Link
              href="/devis"
              className="text-sm text-orange-600 font-medium"
            >
              Tout voir →
            </Link>
          </div>
          {stats.lastDevis.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun devis pour le moment</p>
              <Link
                href="/devis/nouveau"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold"
              >
                <FilePlus className="w-4 h-4" />
                Créer un devis
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.lastDevis.map((d) => (
                <Link
                  key={d.id}
                  href={`/devis/${d.id}`}
                  className="flex items-center justify-between bg-white rounded-xl p-4 border active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={d.status} />
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {d.client.nom}
                        {d.client.prenom ? ` ${d.client.prenom}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">{d.numero}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(d.totalTTC)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─────────────── VERSION DESKTOP ─────────────── */}
      <div className="hidden md:block p-8 max-w-7xl mx-auto">
        {/* Header desktop */}
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

        {/* Stats grid desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Devis ce mois",
              value: devisCeMois,
              sub: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
              icon: FileText,
              color: "bg-blue-50 text-blue-600",
              border: "border-blue-100",
            },
            {
              label: "Devis acceptés",
              value: stats.devisAcceptes,
              sub:
                stats.devisAcceptes === 0
                  ? "Aucun devis accepté"
                  : `devis accepté${stats.devisAcceptes > 1 ? "s" : ""}`,
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
              sub: `${stats.devisAcceptes} devis accepté${stats.devisAcceptes > 1 ? "s" : ""}`,
              icon: Banknote,
              color: "bg-emerald-50 text-emerald-600",
              border: "border-emerald-100",
            },
            {
              label: "En attente de réponse",
              value: devisEnvoyesTotal,
              sub:
                devisEnvoyesTotal === 0
                  ? "Aucun devis en attente"
                  : "devis envoyés sans réponse",
              icon: Clock,
              color: "bg-amber-50 text-amber-600",
              border: "border-amber-100",
            },
          ].map((stat) => {
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
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 truncate">{stat.sub}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0 ml-3`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent devis desktop */}
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

          {recentDevisDesktop.length === 0 ? (
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
            <div className="overflow-x-auto">
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
                  {recentDevisDesktop.map((devis) => (
                    <tr key={devis.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {devis.numero}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 text-sm">{devis.titre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {clientDisplayName(devis.client)}
                        </p>
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
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  label,
  gradient,
  shadow,
  plusColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  gradient: string;
  shadow: string;
  plusColor: string;
}) {
  return (
    <Link href={href} className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} active:scale-95 transition-transform`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
          <span className={`${plusColor} font-bold text-sm leading-none`}>+</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function CircularProgress({ value }: { value: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#22C55E"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  color: "green" | "yellow" | "red";
}) {
  const styles = {
    green: {
      card: "bg-green-50 border-green-100",
      text: "text-green-600",
      iconBg: "bg-green-100",
    },
    yellow: {
      card: "bg-yellow-50 border-yellow-100",
      text: "text-yellow-600",
      iconBg: "bg-yellow-100",
    },
    red: {
      card: "bg-red-50 border-red-100",
      text: "text-red-600",
      iconBg: "bg-red-100",
    },
  };
  const s = styles[color];

  return (
    <div className={`rounded-xl p-4 text-center border ${s.card} ${s.text}`}>
      <div
        className={`w-10 h-10 mx-auto rounded-full ${s.iconBg} flex items-center justify-center`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SIGNE: "bg-green-500",
    EN_ATTENTE: "bg-yellow-500",
    REFUSE: "bg-red-500",
  };
  return (
    <div
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[status] ?? "bg-gray-300"}`}
    />
  );
}
