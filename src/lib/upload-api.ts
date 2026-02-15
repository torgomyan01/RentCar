/**
 * Կայքից ցանկացած տեղից նկար բեռնելու/ջնջելու API.
 * URL-ը միշտ սերվերի դոմեն (https://nampoputi.rent/uploads/...).
 */

const UPLOAD_API = '/api/upload';
const UPLOAD_DELETE_API = '/api/upload/delete';

export interface UploadResult {
  success: boolean;
  url: string;
  path: string;
  fileName: string;
}

export interface UploadError {
  error: string;
}

/**
 * Նկար բեռնել — POST /api/upload.
 * Վերադարձնում է ամբողջ URL (https://nampoputi.rent/uploads/images/xxx.jpg).
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(UPLOAD_API, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as UploadError).error || 'Upload failed');
  }
  return data as UploadResult;
}

/**
 * Նկար ջնջել — DELETE /api/upload/delete?path=images/xxx.jpg
 * path — uploads-ի ներսի հարաբերական ճանապարհ.
 */
export async function deleteUpload(path: string): Promise<void> {
  const res = await fetch(
    `${UPLOAD_DELETE_API}?path=${encodeURIComponent(path)}`,
    {
      method: 'DELETE',
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Delete failed');
  }
}
