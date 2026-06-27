import { supabaseAdmin } from "./supabaseAdmin";

const BUCKET = "print-files";

// 7 days. Admin pages re-sign on each render, so a tablet left open in the
// print room across multiple shifts won't silently break when the operator
// clicks the print file the next morning. Long enough that the URL is
// effectively "good for the work week" but still expires.
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function requireAdmin() {
  if (!supabaseAdmin) throw new Error("Supabase service role not configured");
  return supabaseAdmin;
}

/**
 * Upload a base64 data URL into the private print-files bucket.
 * Returns the storage path (not a URL). Callers persist the path; rendering
 * code calls signedPrintUrl() to mint a short-lived URL on demand.
 */
export async function uploadPrintImage(dataUrl: string, path: string): Promise<string> {
  const supabase = requireAdmin();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const buffer = Buffer.from(match[2], "base64");
  const contentType = match[1] || "image/jpeg";

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

/**
 * Upload a downscaled cart-preview JPEG (base64 data URL) into the private
 * print-files bucket at a deterministic per-cart path. Returns the storage
 * PATH (not a URL) so the abandoned-cart drainer can sign it on demand at
 * send time. upsert:true so a re-sync overwrites cleanly. Throws on error;
 * callers wrap best-effort so a failed preview never breaks cart-sync.
 */
export async function uploadCartPreview(cartId: string, dataUrl: string): Promise<string> {
  const supabase = requireAdmin();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const buffer = Buffer.from(match[2], "base64");
  const contentType = match[1] || "image/jpeg";
  const path = `cart-previews/${cartId}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Cart preview upload failed: ${error.message}`);
  return path;
}

/**
 * Move an object inside the print-files bucket. Used to rename tmp uploads
 * to their permanent order-numbered path once the order row exists.
 */
export async function renamePrintFile(fromPath: string, toPath: string): Promise<string> {
  const supabase = requireAdmin();
  const { error } = await supabase.storage.from(BUCKET).move(fromPath, toPath);
  if (error) throw new Error(`Rename failed: ${error.message}`);
  return toPath;
}

/**
 * Mint a short-lived signed URL for a stored print file. Accepts either a
 * bare path or an already-signed/public URL (legacy rows) and passes the
 * URL through unchanged so old data keeps rendering.
 *
 * Pass a `download` name to set Content-Disposition so the browser saves
 * the file under a sane name (e.g. 'PW-1042-wall-1.jpg') instead of
 * whatever Supabase chose. Saves operator rename + sort time at scale.
 */
export async function signedPrintUrl(
  pathOrUrl: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
  options?: { download?: string },
): Promise<string> {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const supabase = requireAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pathOrUrl, ttlSeconds, options?.download ? { download: options.download } : undefined);
  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}

/** Sign many paths in parallel. Returns same-order array. Failures become "". */
export async function signedPrintUrls(
  pathsOrUrls: string[],
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string[]> {
  return Promise.all(
    pathsOrUrls.map((p) => signedPrintUrl(p, ttlSeconds).catch(() => "")),
  );
}
