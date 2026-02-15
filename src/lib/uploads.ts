/**
 * Նկարների uploads — URL-ը միշտ սերվերի դոմեն (https://nampoputi.rent),
 * որպեսզի լոկալում և սերվերում նույն հղումով ցուցադրվեն նկարները.
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
