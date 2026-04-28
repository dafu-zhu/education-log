import { supabase } from '../lib/supabase';
import type { Course, CourseInput } from '../types';

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('course')
    .select('*')
    .order('term_year', { ascending: true })
    .order('term_season', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('course')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(
  id: string,
  patch: Partial<CourseInput>,
): Promise<Course> {
  const { data, error } = await supabase
    .from('course')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('course').delete().eq('id', id);
  if (error) throw error;
}
