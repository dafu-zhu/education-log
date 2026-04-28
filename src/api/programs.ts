import { supabase } from '../lib/supabase';
import type { Program, ProgramInput } from '../types';

export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('program')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Program[];
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('program')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function updateProgram(
  id: string,
  patch: Partial<ProgramInput>,
): Promise<Program> {
  const { data, error } = await supabase
    .from('program')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('program').delete().eq('id', id);
  if (error) throw error;
}
