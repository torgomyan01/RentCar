/**
 * Upload URL helpers.
 * NOTE: For better performance with next/image we prefer same-origin relative URLs.
 */
const UPLOADS_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';

/** Base URL (without trailing slash) */
export function getUploadsBaseUrl(): string {
  return String(UPLOADS_BASE_URL || '').replace(/\/$/, '');
}

/**
 * Returns image/video URL.
 * - Absolute URLs are returned as is.
 * - Relative URLs are kept same-origin for Next.js optimization.
 * - Legacy API file URLs are kept untouched for backward compatibility.
 */
export function getServerImageUrl(
  urlOrPath: string | null | undefined
): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  const s = urlOrPath.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/api/')) return s;
  if (s.startsWith('/')) return s;
  return `/${s.replace(/^\/+/, '')}`;
}

/**
 * Վերադարձնում է նկարի ամբողջ URL (սերվերի դոմեն + /api/upload/image?path=...).
 * relativePath — uploads-ի ներսի ճանապարհ, օր. "images/xxx.jpg"
 * Ֆայլերը պահվում են արմատի uploads/ պանակում (ոչ public/uploads):
 */
export function buildUploadUrl(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, '');
  const base = getUploadsBaseUrl();
  const localPath = `/api/upload/image?path=${encodeURIComponent(path)}`;
  return base ? `${base}${localPath}` : localPath;
}

/** Արմատի uploads պանակ — process.cwd()/uploads */
export const UPLOADS_RELATIVE_DIR = 'uploads';
