import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"

const UNITE_LABELS: Record<string, string> = {
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

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  PRELEVEMENT: "Prélèvement",
}

function eur(n: number): string {
  return n
    .toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export type FacturePdfAcompte = {
  montant: number
  datePaiement: Date
  modePaiement: string
  reference?: string | null
}

export type FacturePdfData = {
  facture: {
    numero: string
    dateEmission: Date
    dateEcheance: Date
    totalHT: number
    totalTva: number
    totalTTC: number
    montantPaye: number
    status: string
    conditionsPaiement?: string | null
    notes?: string | null
    mentionsLegales?: string | null
  }
  client: {
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
  lignes: Array<{
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
  }>
  user: {
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
    couleurPrimaire?: string | null
  }
  acomptes?: FacturePdfAcompte[]
  devisRef?: { numero: string; titre?: string | null } | null
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (primary: string) =>
  StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#0f172a",
      backgroundColor: "#ffffff",
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 44,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    companyBlock: { flexDirection: "column", maxWidth: 200 },
    logo: { width: 80, height: 40, objectFit: "contain", marginBottom: 6 },
    companyName: { fontFamily: "Helvetica-Bold", fontSize: 13, color: primary, marginBottom: 3 },
    companyLine: { fontSize: 8, color: "#475569", lineHeight: 1.5 },
    factureBlock: { alignItems: "flex-end", flexDirection: "column" },
    factureLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 22,
      color: primary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    factureNumero: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a", marginBottom: 3 },
    factureInfoLine: { fontSize: 8, color: "#475569", marginBottom: 2 },
    divider: { borderBottomWidth: 2, borderBottomColor: primary, marginBottom: 12 },
    infoRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    infoBlock: {
      flex: 1,
      borderWidth: 0.5,
      borderColor: "#e2e8f0",
      borderRadius: 3,
      padding: 8,
    },
    infoBlockLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      color: primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    infoLine: { fontSize: 8.5, color: "#0f172a", marginBottom: 2, lineHeight: 1.4 },
    infoLineMuted: { fontSize: 8, color: "#64748b", marginBottom: 1.5 },
    // Table
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primary,
      paddingHorizontal: 6,
      paddingVertical: 5,
      borderRadius: 2,
    },
    tableRow: {
      flexDirection: "row",
      paddingHorizontal: 6,
      paddingVertical: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: "#f1f5f9",
    },
    tableRowEven: { backgroundColor: "#f8fafc" },
    sectionRow: {
      flexDirection: "row",
      backgroundColor: "#f1f5f9",
      paddingHorizontal: 6,
      paddingVertical: 5,
      marginTop: 4,
    },
    sectionText: { fontFamily: "Helvetica-Bold", fontSize: 9, color: primary },
    colDesig: { flex: 1 },
    colQty: { width: 36, textAlign: "right" },
    colUnit: { width: 32, textAlign: "center" },
    colPrix: { width: 60, textAlign: "right" },
    colRem: { width: 34, textAlign: "right" },
    colTva: { width: 32, textAlign: "right" },
    colTotal: { width: 60, textAlign: "right" },
    cellText: { fontSize: 8.5, color: "#0f172a" },
    cellTextBold: { fontSize: 8.5, color: "#0f172a", fontFamily: "Helvetica-Bold" },
    cellDesc: { fontSize: 7.5, color: "#64748b", marginTop: 1.5, lineHeight: 1.4 },
    // Bottom
    bottomRow: { flexDirection: "row", gap: 10, marginTop: 16 },
    conditionsBlock: { flex: 1 },
    totauxBlock: { width: 200 },
    sectionTitle2: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      color: primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    condText: { fontSize: 8.5, color: "#475569", lineHeight: 1.5, marginBottom: 4 },
    totRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    totLabel: { fontSize: 8.5, color: "#475569" },
    totValue: { fontSize: 8.5, color: "#0f172a", fontFamily: "Helvetica-Bold" },
    totDivider: { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", marginVertical: 4 },
    totTtcLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: primary },
    totTtcValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: primary },
    totNetLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    totNetValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    // Paiements
    paiementsBlock: {
      marginTop: 14,
      borderWidth: 0.5,
      borderColor: "#e2e8f0",
      borderRadius: 3,
      padding: 8,
    },
    paiementRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    paiementLabel: { fontSize: 8, color: "#475569" },
    paiementValue: { fontSize: 8, color: "#059669", fontFamily: "Helvetica-Bold" },
    // Footer
    pageNumber: {
      position: "absolute",
      bottom: 20,
      right: 44,
      fontSize: 7,
      color: "#94a3b8",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 44,
      right: 44,
    },
    footerText: { fontSize: 7, color: "#94a3b8", lineHeight: 1.5, textAlign: "center" },
    footerDivider: { borderTopWidth: 0.5, borderTopColor: "#e2e8f0", marginBottom: 4 },
  })

function TableHeaderCell({ style, children }: { style: Style; children: string }) {
  return (
    <Text style={[{ fontSize: 7.5, color: "#ffffff", fontFamily: "Helvetica-Bold" }, style]}>
      {children}
    </Text>
  )
}

function tvaDetails(lignes: FacturePdfData["lignes"]) {
  const map = new Map<number, { base: number; montant: number }>()
  for (const l of lignes.filter((l) => l.ligneType === "LINE")) {
    const tva = Math.round(l.totalHtNet * (l.tauxTva / 100) * 100) / 100
    const ex = map.get(l.tauxTva) ?? { base: 0, montant: 0 }
    map.set(l.tauxTva, {
      base: Math.round((ex.base + l.totalHtNet) * 100) / 100,
      montant: Math.round((ex.montant + tva) * 100) / 100,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([taux, v]) => ({ taux, ...v }))
}

// ─── Main component ─────────────────────────────────────────────────────────

export function FacturePDF({ facture: f, client, lignes, user, acomptes = [], devisRef }: FacturePdfData) {
  const primary = user.couleurPrimaire ?? "#1d4ed8"
  const styles = makeStyles(primary)
  const tva = tvaDetails(lignes)
  const resteAPayer = Math.round((f.totalTTC - f.montantPaye) * 100) / 100

  const clientName = client.type === "PROFESSIONNEL" && client.societe
    ? client.societe
    : [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ")

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          <View style={styles.companyBlock}>
            {user.companyLogo ? (
              <Image style={styles.logo} src={user.companyLogo} />
            ) : null}
            {user.companyName && (
              <Text style={styles.companyName}>{user.companyName}</Text>
            )}
            {user.companyAddress && (
              <Text style={styles.companyLine}>{user.companyAddress}</Text>
            )}
            {(user.companyPostalCode || user.companyCity) && (
              <Text style={styles.companyLine}>
                {[user.companyPostalCode, user.companyCity].filter(Boolean).join(" ")}
              </Text>
            )}
            {user.companyPhone && (
              <Text style={styles.companyLine}>Tél : {user.companyPhone}</Text>
            )}
            {user.companyEmail && (
              <Text style={styles.companyLine}>{user.companyEmail}</Text>
            )}
            {user.companySiret && (
              <Text style={styles.companyLine}>SIRET : {user.companySiret}</Text>
            )}
            {user.companyTvaIntra && (
              <Text style={styles.companyLine}>TVA : {user.companyTvaIntra}</Text>
            )}
            {user.companyFormeJuridique && user.companyCapital && (
              <Text style={styles.companyLine}>
                {user.companyFormeJuridique} — Capital {user.companyCapital}
              </Text>
            )}
          </View>

          <View style={styles.factureBlock}>
            <Text style={styles.factureLabel}>FACTURE</Text>
            <Text style={styles.factureNumero}>{f.numero}</Text>
            <Text style={styles.factureInfoLine}>Émise le {fmtDate(f.dateEmission)}</Text>
            <Text style={styles.factureInfoLine}>Échéance le {fmtDate(f.dateEcheance)}</Text>
            {devisRef && (
              <Text style={styles.factureInfoLine}>
                Réf. devis : {devisRef.numero}{devisRef.titre ? ` — ${devisRef.titre}` : ""}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} fixed />

        {/* ── Client ──────────────────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockLabel}>Destinataire</Text>
            <Text style={[styles.infoLine, { fontFamily: "Helvetica-Bold" }]}>{clientName}</Text>
            {client.adresse && <Text style={styles.infoLine}>{client.adresse}</Text>}
            {(client.codePostal || client.ville) && (
              <Text style={styles.infoLine}>
                {[client.codePostal, client.ville].filter(Boolean).join(" ")}
              </Text>
            )}
            {client.telephone && <Text style={styles.infoLineMuted}>Tél : {client.telephone}</Text>}
            {client.portable && <Text style={styles.infoLineMuted}>Mob : {client.portable}</Text>}
            {client.email && <Text style={styles.infoLineMuted}>{client.email}</Text>}
          </View>
          <View style={[styles.infoBlock, { backgroundColor: "#fafafa" }]} />
        </View>

        {/* ── Table lignes ────────────────────────────────────────────────── */}
        <View style={styles.tableHeader}>
          <TableHeaderCell style={styles.colDesig}>Désignation</TableHeaderCell>
          <TableHeaderCell style={styles.colQty}>Qté</TableHeaderCell>
          <TableHeaderCell style={styles.colUnit}>U.</TableHeaderCell>
          <TableHeaderCell style={styles.colPrix}>P.U. HT</TableHeaderCell>
          <TableHeaderCell style={styles.colRem}>Rem.</TableHeaderCell>
          <TableHeaderCell style={styles.colTva}>TVA</TableHeaderCell>
          <TableHeaderCell style={styles.colTotal}>Total HT</TableHeaderCell>
        </View>

        {lignes.map((l, idx) => {
          if (l.ligneType === "SECTION") {
            return (
              <View key={idx} style={styles.sectionRow}>
                <Text style={styles.sectionText}>{l.designation}</Text>
              </View>
            )
          }
          return (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 0 ? {} : styles.tableRowEven]}
              wrap={false}
            >
              <View style={styles.colDesig}>
                <Text style={styles.cellText}>{l.designation}</Text>
                {l.description ? <Text style={styles.cellDesc}>{l.description}</Text> : null}
              </View>
              <Text style={[styles.colQty, styles.cellText]}>
                {l.quantite % 1 === 0 ? l.quantite.toString() : l.quantite.toFixed(2)}
              </Text>
              <Text style={[styles.colUnit, styles.cellText]}>
                {UNITE_LABELS[l.unite] ?? l.unite}
              </Text>
              <Text style={[styles.colPrix, styles.cellText]}>{eur(l.prixUnitaireHT)}</Text>
              <Text style={[styles.colRem, styles.cellText]}>
                {l.remise > 0 ? `${l.remise} %` : "—"}
              </Text>
              <Text style={[styles.colTva, styles.cellText]}>{l.tauxTva} %</Text>
              <Text style={[styles.colTotal, styles.cellTextBold]}>
                {eur(l.totalHtNet)}
              </Text>
            </View>
          )
        })}

        {/* ── Bottom: Conditions + Totaux ─────────────────────────────────── */}
        <View style={styles.bottomRow} wrap={false}>
          {/* Conditions / notes */}
          <View style={styles.conditionsBlock}>
            {f.conditionsPaiement && (
              <>
                <Text style={styles.sectionTitle2}>Conditions de paiement</Text>
                <Text style={styles.condText}>{f.conditionsPaiement}</Text>
              </>
            )}
            {f.notes && (
              <>
                <Text style={styles.sectionTitle2}>Notes</Text>
                <Text style={styles.condText}>{f.notes}</Text>
              </>
            )}
          </View>

          {/* Totaux */}
          <View style={styles.totauxBlock}>
            <View style={styles.totRow}>
              <Text style={[styles.totLabel, { fontFamily: "Helvetica-Bold" }]}>Total HT</Text>
              <Text style={styles.totValue}>{eur(f.totalHT)}</Text>
            </View>

            <View style={styles.totDivider} />

            {tva.map((t) => (
              <View key={t.taux} style={styles.totRow}>
                <Text style={styles.totLabel}>
                  TVA {t.taux} % (base {eur(t.base)})
                </Text>
                <Text style={styles.totValue}>{eur(t.montant)}</Text>
              </View>
            ))}

            <View style={styles.totDivider} />

            <View style={styles.totRow}>
              <Text style={styles.totTtcLabel}>Total TTC</Text>
              <Text style={styles.totTtcValue}>{eur(f.totalTTC)}</Text>
            </View>

            {acomptes.length > 0 && (
              <>
                <View style={styles.totDivider} />
                {acomptes.map((a, i) => (
                  <View key={i} style={styles.totRow}>
                    <Text style={styles.totLabel}>
                      Acompte {fmtDate(a.datePaiement)}
                      {a.modePaiement ? ` (${MODE_PAIEMENT_LABELS[a.modePaiement] ?? a.modePaiement})` : ""}
                    </Text>
                    <Text style={[styles.totValue, { color: "#059669" }]}>− {eur(a.montant)}</Text>
                  </View>
                ))}
                <View style={styles.totDivider} />
                <View style={styles.totRow}>
                  <Text style={styles.totNetLabel}>Net à payer</Text>
                  <Text style={styles.totNetValue}>{eur(resteAPayer)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {f.mentionsLegales && (
          <View style={styles.footer} fixed>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>{f.mentionsLegales}</Text>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""
          }
          fixed
        />
      </Page>
    </Document>
  )
}
