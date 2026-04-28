import { supabase } from '../lib/supabase';

const BUCKET = 'syllabi';
const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes — fresh for each view

/** "FinM 34500" → "finm34500" — lowercase, alphanumeric only. */
export function safeCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pathFor(userId: string, courseId: string, code: string): string {
  return `${userId}/${courseId}/${safeCode(code)}_syllabus.pdf`;
}

/** Upload (or replace) the syllabus PDF for a course. Returns the storage path. */
export async function uploadSyllabus(
  courseId: string,
  code: string,
  file: File,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const path = pathFor(user.id, courseId, code);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (error) throw error;
  return path;
}

/**
 * Rename a syllabus file when the course code changes.
 * Returns the new path (or the original if nothing needed to change).
 */
export async function moveSyllabusForCodeChange(
  oldPath: string,
  courseId: string,
  newCode: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const newPath = pathFor(user.id, courseId, newCode);
  if (oldPath === newPath) return oldPath;
  const { error } = await supabase.storage.from(BUCKET).move(oldPath, newPath);
  if (error) throw error;
  return newPath;
}

/** Get a short-lived signed URL to view a syllabus. */
export async function getSyllabusUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Delete a syllabus file. Safe to call when no file exists. */
export async function deleteSyllabus(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
