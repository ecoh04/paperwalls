import { supabase } from "./supabase";

const BUCKET = "print-files";

/**
 * Upload a data URL (base64 image) to Supabase Storage and return the public URL.
 * Bucket must exist and allow public read (or use signed URL if preferred).
 */
export async function uploadPrintImage(dataUrl: string, path: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  const contentType = (match[1] || "image/jpeg").split("/")[1] || "jpeg";

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: `image/${contentType}`,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}
