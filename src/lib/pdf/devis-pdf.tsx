import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"
import type { DevisPdfData, DevisPdfLigne } from "./types"

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

function eur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtDatetime(d: Date | null | undefined): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function tvaDetails(lignes: DevisPdfLigne[], totalHT: number, remiseGlobale: number, remiseGlobaleType: string) {
  const totalRemise = remiseGlobaleType === "PERCENT"
    ? totalHT * (remiseGlobale / 100)
    : Math.min(remiseGlobale, totalHT)
  const totalHtNet = totalHT - totalRemise
  const remiseRatio = totalHT > 0 ? totalHtNet / totalHT : 1

  const map = new Map<number, { base: number; montant: number }>()
  for (const l of lignes.filter((l) => l.ligneType === "LINE")) {
    const htFinal = Math.round(l.totalHtNet * remiseRatio * 100) / 100
    const tva = Math.round(htFinal * (l.tauxTva / 100) * 100) / 100
    const ex = map.get(l.tauxTva) ?? { base: 0, montant: 0 }
    map.set(l.tauxTva, {
      base: Math.round((ex.base + htFinal) * 100) / 100,
      montant: Math.round((ex.montant + tva) * 100) / 100,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([taux, v]) => ({ taux, ...v }))
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    // Signed badge (top-right watermark)
    signedBadge: {
      position: "absolute",
      top: 14,
      right: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#d1fae5",
      borderWidth: 1,
      borderColor: "#6ee7b7",
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    signedBadgeDot: {
      width: 5,
      height: 5,
      borderRadius: 99,
      backgroundColor: "#059669",
    },
    signedBadgeText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      color: "#065f46",
      letterSpacing: 0.5,
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    companyBlock: { flexDirection: "column", maxWidth: 200 },
    logo: { width: 80, height: 40, objectFit: "contain", marginBottom: 6 },
    companyName: { fontFamily: "Helvetica-Bold", fontSize: 13, color: primary, marginBottom: 3 },
    companyLine: { fontSize: 8, color: "#475569", lineHeight: 1.5 },
    devisBlock: {
      alignItems: "flex-end",
      flexDirection: "column",
    },
    devisLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 22,
      color: primary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    devisNumero: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a", marginBottom: 3 },
    devisInfoLine: { fontSize: 8, color: "#475569", marginBottom: 2 },
    // Divider
    divider: { borderBottomWidth: 2, borderBottomColor: primary, marginBottom: 12 },
    thinDivider: { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", marginBottom: 10 },
    // Titre
    titreBand: {
      backgroundColor: primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 14,
      borderRadius: 2,
    },
    titreText: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#ffffff" },
    // Client / Chantier blocks
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
    tableHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff" },
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
    // Table columns
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
    // Totaux / conditions
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
    // Blank signature section (non signé)
    signSection: {
      marginTop: 20,
      borderWidth: 0.5,
      borderColor: "#e2e8f0",
      borderRadius: 3,
      padding: 10,
    },
    signTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8,
      color: primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    signRow: { flexDirection: "row", gap: 20 },
    signBox: { flex: 1 },
    signLabel: { fontSize: 7.5, color: "#475569", marginBottom: 3 },
    signArea: {
      borderWidth: 0.5,
      borderColor: "#cbd5e1",
      height: 60,
      borderRadius: 2,
      padding: 4,
    },
    // Signed signature section
    signedSection: {
      marginTop: 20,
      borderWidth: 1,
      borderColor: "#6ee7b7",
      borderRadius: 4,
      backgroundColor: "#f0fdf4",
      padding: 12,
    },
    signedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    signedTitleText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
      color: "#065f46",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    signedBody: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
    signedLeft: { flex: 1 },
    signedRight: { width: 80, alignItems: "center" },
    signedMetaRow: { flexDirection: "row", marginBottom: 4 },
    signedMetaLabel: { fontSize: 8, color: "#374151", width: 80 },
    signedMetaValue: { fontSize: 8, color: "#0f172a", fontFamily: "Helvetica-Bold", flex: 1 },
    signedImageBox: {
      borderWidth: 0.5,
      borderColor: "#86efac",
      borderRadius: 3,
      backgroundColor: "#ffffff",
      padding: 4,
      marginTop: 6,
      height: 56,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    signedImage: { maxWidth: "100%", maxHeight: 48, objectFit: "contain" },
    signedLegalNote: {
      fontSize: 7,
      color: "#6b7280",
      lineHeight: 1.5,
      marginTop: 8,
      fontStyle: "italic",
    },
    qrBlock: { alignItems: "center" },
    qrImage: { width: 60, height: 60 },
    qrLabel: { fontSize: 6, color: "#6b7280", textAlign: "center", marginTop: 3, lineHeight: 1.4 },
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

// ─── Column widths helper ─────────────────────────────────────────────────────

function TableHeaderCell({ style, children }: { style: Style; children: string }) {
  return (
    <Text style={[{ fontSize: 7.5, color: "#ffffff", fontFamily: "Helvetica-Bold" }, style]}>
      {children}
    </Text>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DevisPDF({ devis: d, client, lignes, user, signature }: DevisPdfData) {
  const primary = user.couleurPrimaire ?? "#1d4ed8"
  const styles = makeStyles(primary)
  const isSigned = !!signature

  const tva = tvaDetails(lignes, d.totalHT, d.remiseGlobale, d.remiseGlobaleType)
  const totalHtNet = d.totalHT - d.totalRemise
  const acompteMontant =
    d.acompteType === "PERCENT"
      ? Math.round(d.totalTTC * (d.acompte / 100) * 100) / 100
      : Math.min(d.acompte, d.totalTTC)
  const netAPayer = Math.round((d.totalTTC - acompteMontant) * 100) / 100

  const clientName = client.type === "PROFESSIONNEL" && client.societe
    ? client.societe
    : [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ")

  const hasRemiseLignes = d.totalHT > totalHtNet - d.totalRemise + 0.005
  const hasRemiseGlobale = d.totalRemise > 0.005

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Signed badge (filigrane haut droite) ────────────────────────── */}
        {isSigned && (
          <View style={styles.signedBadge} fixed>
            <View style={styles.signedBadgeDot} />
            <Text style={styles.signedBadgeText}>SIGNÉ ÉLECTRONIQUEMENT</Text>
          </View>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          {/* Company info */}
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

          {/* Devis identity */}
          <View style={styles.devisBlock}>
            <Text style={styles.devisLabel}>DEVIS</Text>
            <Text style={styles.devisNumero}>{d.numero}</Text>
            <Text style={styles.devisInfoLine}>Émis le {fmtDate(d.dateEmission)}</Text>
            {d.dateValidite && (
              <Text style={styles.devisInfoLine}>Valable jusqu'au {fmtDate(d.dateValidite)}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} fixed />

        {/* ── Titre ───────────────────────────────────────────────────────── */}
        <View style={styles.titreBand}>
          <Text style={styles.titreText}>{d.titre}</Text>
        </View>

        {/* ── Client / Chantier ───────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          {/* Client */}
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

          {/* Chantier */}
          {(d.adresseChantier || d.objetTravaux || d.dateDebutPrevisionnel) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.infoBlockLabel}>Chantier</Text>
              {d.adresseChantier && <Text style={styles.infoLine}>{d.adresseChantier}</Text>}
              {d.objetTravaux && <Text style={styles.infoLineMuted}>{d.objetTravaux}</Text>}
              {d.dateDebutPrevisionnel && (
                <Text style={styles.infoLineMuted}>
                  Début prévu : {fmtDate(d.dateDebutPrevisionnel)}
                </Text>
              )}
            </View>
          ) : (
            <View style={[styles.infoBlock, { backgroundColor: "#fafafa" }]} />
          )}
        </View>

        {/* ── Table prestations ───────────────────────────────────────────── */}
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
          {/* Conditions */}
          <View style={styles.conditionsBlock}>
            {(d.conditionsPaiement || d.delaiExecution || d.notes) && (
              <>
                {d.conditionsPaiement && (
                  <>
                    <Text style={styles.sectionTitle2}>Conditions de paiement</Text>
                    <Text style={styles.condText}>{d.conditionsPaiement}</Text>
                  </>
                )}
                {d.delaiExecution && (
                  <>
                    <Text style={styles.sectionTitle2}>Délai d'exécution</Text>
                    <Text style={styles.condText}>{d.delaiExecution}</Text>
                  </>
                )}
                {d.notes && (
                  <>
                    <Text style={styles.sectionTitle2}>Notes</Text>
                    <Text style={styles.condText}>{d.notes}</Text>
                  </>
                )}
              </>
            )}
          </View>

          {/* Totaux */}
          <View style={styles.totauxBlock}>
            {hasRemiseLignes && (
              <View style={styles.totRow}>
                <Text style={styles.totLabel}>Total HT brut</Text>
                <Text style={styles.totValue}>{eur(d.totalHT)}</Text>
              </View>
            )}
            {hasRemiseLignes && (
              <View style={styles.totRow}>
                <Text style={styles.totLabel}>Remises</Text>
                <Text style={styles.totValue}>− {eur(d.totalHT - totalHtNet)}</Text>
              </View>
            )}
            <View style={styles.totRow}>
              <Text style={[styles.totLabel, { fontFamily: "Helvetica-Bold" }]}>Total HT</Text>
              <Text style={styles.totValue}>{eur(hasRemiseLignes ? totalHtNet : d.totalHT)}</Text>
            </View>
            {hasRemiseGlobale && (
              <View style={styles.totRow}>
                <Text style={styles.totLabel}>
                  Remise globale{d.remiseGlobaleType === "PERCENT" ? ` (${d.remiseGlobale} %)` : ""}
                </Text>
                <Text style={styles.totValue}>− {eur(d.totalRemise)}</Text>
              </View>
            )}
            {hasRemiseGlobale && (
              <View style={styles.totRow}>
                <Text style={[styles.totLabel, { fontFamily: "Helvetica-Bold" }]}>
                  Total HT net
                </Text>
                <Text style={styles.totValue}>{eur(totalHtNet)}</Text>
              </View>
            )}

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
              <Text style={styles.totTtcValue}>{eur(d.totalTTC)}</Text>
            </View>

            {acompteMontant > 0 && (
              <>
                <View style={[styles.totRow, { marginTop: 4 }]}>
                  <Text style={styles.totLabel}>
                    Acompte{d.acompteType === "PERCENT" ? ` (${d.acompte} %)` : ""}
                  </Text>
                  <Text style={styles.totValue}>{eur(acompteMontant)}</Text>
                </View>
                <View style={styles.totDivider} />
                <View style={styles.totRow}>
                  <Text style={styles.totNetLabel}>Net à payer</Text>
                  <Text style={styles.totNetValue}>{eur(netAPayer)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Signature section ───────────────────────────────────────────── */}
        {isSigned && signature ? (
          <View style={styles.signedSection} wrap={false}>
            {/* Header */}
            <View style={styles.signedHeader}>
              <Text style={styles.signedTitleText}>
                ✓ Devis accepté et signé électroniquement
              </Text>
            </View>

            <View style={styles.signedBody}>
              {/* Left: metadata + signature image */}
              <View style={styles.signedLeft}>
                <View style={styles.signedMetaRow}>
                  <Text style={styles.signedMetaLabel}>Signataire :</Text>
                  <Text style={styles.signedMetaValue}>{signature.signatairenom || "—"}</Text>
                </View>
                <View style={styles.signedMetaRow}>
                  <Text style={styles.signedMetaLabel}>Date :</Text>
                  <Text style={styles.signedMetaValue}>{fmtDatetime(signature.dateSignature)}</Text>
                </View>
                <View style={styles.signedMetaRow}>
                  <Text style={styles.signedMetaLabel}>Devis :</Text>
                  <Text style={styles.signedMetaValue}>{d.numero}</Text>
                </View>

                {/* Signature image */}
                <View style={styles.signedImageBox}>
                  <Image style={styles.signedImage} src={signature.imageBase64} />
                </View>
              </View>

              {/* Right: QR code */}
              <View style={styles.qrBlock}>
                <Image style={styles.qrImage} src={signature.qrDataUrl} />
                <Text style={styles.qrLabel}>Scannez pour{"\n"}vérifier</Text>
              </View>
            </View>

            <Text style={styles.signedLegalNote}>
              Signature électronique valide selon l'article 1367 du Code civil. Ce document constitue un engagement contractuel. URL de vérification : {signature.verifyUrl}
            </Text>
          </View>
        ) : (
          /* Blank "bon pour accord" section */
          <View style={styles.signSection} wrap={false}>
            <Text style={styles.signTitle}>Bon pour accord</Text>
            <View style={styles.signRow}>
              <View style={styles.signBox}>
                <Text style={styles.signLabel}>Date :</Text>
                <View style={styles.signArea} />
              </View>
              <View style={[styles.signBox, { flex: 2 }]}>
                <Text style={styles.signLabel}>Signature du client (précédée de la mention « Lu et approuvé ») :</Text>
                <View style={styles.signArea} />
              </View>
            </View>
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {d.mentionsLegales && (
          <View style={styles.footer} fixed>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>{d.mentionsLegales}</Text>
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
