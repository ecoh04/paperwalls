import { supabaseAdmin } from "./supabaseAdmin";

const BUCKET = "print-files";

// 24h is enough for a tab open, a download, and a forward to the printer.
// Admin pages re-sign on each render so refreshing always works.
const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

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
 */
export async function signedPrintUrl(
  pathOrUrl: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const supabase = requireAdmin();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, ttlSeconds);
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
