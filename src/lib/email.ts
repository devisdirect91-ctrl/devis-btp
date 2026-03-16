import { Resend } from "resend";

const FROM_ADDRESS =
  process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.startsWith("re_test")
    ? "noreply@btpoche.fr"
    : "onboarding@resend.dev";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[email] RESEND_API_KEY is not set — skipping email send to:",
      opts.to
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) {
    console.error("[email] Failed to send email:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function baseLayout(headerTitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.12);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0a1628;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">BTPoche</p>
              <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${headerTitle}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                Cet email a été envoyé automatiquement par BTPoche. Merci de ne pas répondre directement à ce message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template 1 — Confirmation client après signature
// ---------------------------------------------------------------------------

export function emailSignatureConfirmationClient(data: {
  devisNumero: string;
  devisTitre: string;
  totalTTC: number;
  clientNom: string;
  artisanNom: string;
  artisanPhone?: string | null;
  artisanEmail?: string | null;
  dateSignature: Date;
  signatairenom: string;
}): string {
  const contactLines: string[] = [];
  if (data.artisanPhone) {
    contactLines.push(
      `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Téléphone</td><td style="padding:6px 0;font-size:13px;color:#111827;">${data.artisanPhone}</td></tr>`
    );
  }
  if (data.artisanEmail) {
    contactLines.push(
      `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Email</td><td style="padding:6px 0;font-size:13px;color:#111827;"><a href="mailto:${data.artisanEmail}" style="color:#2563eb;text-decoration:none;">${data.artisanEmail}</a></td></tr>`
    );
  }

  const contactSection =
    contactLines.length > 0
      ? `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:4px;">${contactLines.join("")}</table>`
      : "";

  const body = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Bonjour ${data.clientNom},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
      Votre signature a bien été enregistrée. Vous trouverez ci-dessous le récapitulatif du devis accepté.
    </p>

    <!-- Devis info box -->
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="background-color:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">Devis</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827;">${data.devisNumero} — ${data.devisTitre}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Signataire</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;">${data.signatairenom}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Date de signature</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;">${formatDate(data.dateSignature)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 6px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;font-weight:600;" colspan="2">Montant total TTC</td>
            </tr>
            <tr>
              <td style="padding:0 0 6px;font-size:24px;font-weight:700;color:#059669;" colspan="2">${formatCurrency(data.totalTTC)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Badge accepté -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#d1fae5;border:1px solid #a7f3d0;border-radius:4px;padding:8px 14px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#065f46;">&#10003; Devis accepté et signé</p>
        </td>
      </tr>
    </table>

    <!-- Artisan contact -->
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Votre artisan</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:0;margin-bottom:8px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">${data.artisanNom}</p>
          ${contactSection}
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
      Un exemplaire signé du devis est joint à cet email en pièce jointe au format PDF.
    </p>
  `;

  return baseLayout("Confirmation de signature de devis", body);
}

// ---------------------------------------------------------------------------
// Template 2 — Notification artisan après signature client
// ---------------------------------------------------------------------------

export function emailSignatureNotificationArtisan(data: {
  devisNumero: string;
  devisTitre: string;
  totalTTC: number;
  clientNom: string;
  action: "SIGNE" | "REFUSE";
  dateSignature: Date;
  signatairenom: string;
  motifRefus?: string | null;
}): string {
  const isAccepted = data.action === "SIGNE";

  const accentColor = isAccepted ? "#059669" : "#dc2626";
  const badgeBg = isAccepted ? "#d1fae5" : "#fee2e2";
  const badgeBorder = isAccepted ? "#a7f3d0" : "#fca5a5";
  const badgeTextColor = isAccepted ? "#065f46" : "#991b1b";
  const badgeIcon = isAccepted ? "&#10003;" : "&#10007;";
  const badgeLabel = isAccepted ? "Devis accepté" : "Devis refusé";
  const actionLabel = isAccepted ? "accepté" : "refusé";

  const body = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Bonjour,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
      Votre client <strong>${data.clientNom}</strong> vient de ${actionLabel} le devis suivant.
    </p>

    <!-- Devis info box -->
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="background-color:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">Devis</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827;">${data.devisNumero} — ${data.devisTitre}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Client</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;">${data.clientNom}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Signataire</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;">${data.signatairenom}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Date</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;">${formatDate(data.dateSignature)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 6px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;font-weight:600;" colspan="2">Montant total TTC</td>
            </tr>
            <tr>
              <td style="padding:0 0 6px;font-size:24px;font-weight:700;color:${accentColor};" colspan="2">${formatCurrency(data.totalTTC)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Status badge -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:${badgeBg};border:1px solid ${badgeBorder};border-radius:4px;padding:8px 14px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:${badgeTextColor};">${badgeIcon} ${badgeLabel}</p>
        </td>
      </tr>
    </table>

    ${
      isAccepted
        ? `<p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
        Le client a reçu une confirmation par email avec le devis signé en pièce jointe. Vous pouvez maintenant procéder aux prochaines étapes de votre chantier.
      </p>`
        : `<p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
        Le client a refusé ce devis. Nous vous invitons à le contacter pour comprendre ses objections et, si nécessaire, établir un nouveau devis.
      </p>${data.motifRefus ? `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:16px;">
        <tr>
          <td style="background-color:#fff7f7;border:1px solid #fca5a5;border-radius:6px;padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#991b1b;">Motif indiqué</p>
            <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.5;">${data.motifRefus}</p>
          </td>
        </tr>
      </table>` : ""}`
    }
  `;

  const headerTitle = isAccepted
    ? "Un client a accepté votre devis"
    : "Un client a refusé votre devis";

  return baseLayout(headerTitle, body);
}
