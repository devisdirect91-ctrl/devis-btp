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
} as const;

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
