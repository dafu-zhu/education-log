import { supabase } from '../lib/supabase';

const BUCKET = 'syllabi';
const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes — fresh for each view

function pathFor(userId: string, courseId: string): string {
  return `${userId}/${courseId}.pdf`;
}

/** Upload (or replace) the syllabus PDF for a given course. Returns the storage path. */
export async function uploadSyllabus(courseId: string, file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const path = pathFor(user.id, courseId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (error) throw error;
  return path;
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
