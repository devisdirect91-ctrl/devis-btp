import { createClient } from "@supabase/supabase-js";

// Client public (côté navigateur)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Client admin (côté serveur uniquement - ne jamais exposer côté client)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const STORAGE_BUCKETS = {
  LOGOS: "logos",
  PDFS: "pdfs",
  SIGNATURES: "signatures",
} as const;

/** Upload une signature (base64 data URL) vers Supabase Storage et retourne l'URL publique */
export async function uploadSignatureBase64(
  userId: string,
  devisId: string,
  base64DataUrl: string
): Promise<string> {
  // Extrait le contenu binaire depuis le data URL
  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64, "base64")
  const path = `${userId}/${devisId}/signature.png`

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.SIGNATURES)
    .upload(path, buffer, { contentType: "image/png", upsert: true })

  if (error) throw error

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKETS.SIGNATURES).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
