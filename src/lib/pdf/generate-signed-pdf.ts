import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { DevisPDF } from "./devis-pdf"
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase"
import type { DevisPdfData } from "./types"

/** Génère le buffer PDF signé avec signature manuscrite */
export async function generateSignedPdfBuffer(
  pdfData: DevisPdfData,
  opts: {
    /** URL Supabase Storage ou data URL base64 de la signature */
    signatureSrc: string
    signatairenom: string
    dateSignature: Date
  }
): Promise<Buffer> {
  const dataWithSignature: DevisPdfData = {
    ...pdfData,
    devis: { ...pdfData.devis, status: "ACCEPTE" },
    signature: {
      imageSrc: opts.signatureSrc,
      signatairenom: opts.signatairenom,
      dateSignature: opts.dateSignature,
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
