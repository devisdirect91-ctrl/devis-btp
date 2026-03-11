import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import QRCode from "qrcode"
import { DevisPDF } from "./devis-pdf"
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase"
import type { DevisPdfData } from "./types"

/** Génère le data URL PNG du QR code pointant vers la page de vérification */
export async function generateQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  })
}

/** Génère le buffer PDF signé avec signature, QR code et badge */
export async function generateSignedPdfBuffer(
  pdfData: DevisPdfData,
  opts: {
    signatureBase64: string
    signatairenom: string
    dateSignature: Date
    verifyUrl: string
  }
): Promise<Buffer> {
  const qrDataUrl = await generateQrDataUrl(opts.verifyUrl)

  const dataWithSignature: DevisPdfData = {
    ...pdfData,
    devis: { ...pdfData.devis, status: "ACCEPTE" },
    signature: {
      imageBase64: opts.signatureBase64,
      signatairenom: opts.signatairenom,
      dateSignature: opts.dateSignature,
      verifyUrl: opts.verifyUrl,
      qrDataUrl,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.from(await renderToBuffer(createElement(DevisPDF, dataWithSignature) as any))
}

/** Upload le PDF signé vers Supabase Storage et retourne l'URL publique */
export async function uploadSignedPdf(
  userId: string,
  devisId: string,
  devisNumero: string,
  pdfBuffer: Buffer
): Promise<string> {
  const path = `signed/${userId}/${devisId}/${devisNumero}-signe.pdf`

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PDFS)
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) throw error

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKETS.PDFS).getPublicUrl(path)
  return data.publicUrl
}
