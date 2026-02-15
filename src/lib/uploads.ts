/**
 * Նկարների uploads — URL-ը միշտ սերվերի դոմեն (https://nampoputi.rent),
 * որպեսզի լոկալում և սերվերում նույն հղումով ցուցադրվեն նկարները.
 * Լոկալում էլ հարցումը գնում է սերվերի API-ին (NEXT_PUBLIC_SERVER_URL).
 */

const UPLOADS_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://nampoputi.rent';

/** Սերվերի base URL (առանց trailing slash) — uploads-ի հղումների համար */
export function getUploadsBaseUrl(): string {
  return UPLOADS_BASE_URL.replace(/\/$/, '');
}

/**
 * Տալիս է նկարի ամբողջ URL — relative path-ի դեպքում սերվերի API (լոկալում էլ նկարը բեռնվի սերվերից).
 * Օգտագործել img src, video src և այլնի համար.
 */
export function getServerImageUrl(
  urlOrPath: string | null | undefined
): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  const s = urlOrPath.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return getUploadsBaseUrl() + s;
  return getUploadsBaseUrl() + '/' + s;
}

/**
 * Վերադարձնում է նկարի ամբողջ URL (սերվերի դոմեն + /api/upload/image?path=...).
 * relativePath — uploads-ի ներսի ճանապարհ, օր. "images/xxx.jpg"
 * Ֆայլերը պահվում են արմատի uploads/ պանակում (ոչ public/uploads):
 */
export function buildUploadUrl(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, '');
  return `${getUploadsBaseUrl()}/api/upload/image?path=${encodeURIComponent(path)}`;
}

/** Արմատի uploads պանակ — process.cwd()/uploads */
export const UPLOADS_RELATIVE_DIR = 'uploads';
