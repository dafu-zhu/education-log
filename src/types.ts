// Domain types — kept in sync with supabase/migrations/20260428000001_schema.sql.
// If you change the schema, update this file too.

export type ProgramKind = 'degree' | 'certificate';
export type LifecycleStatus = 'completed' | 'in_progress' | 'planned';
export type CourseType = 'credit' | 'audit' | 'self_study';
export type TermSeason = 'autumn' | 'winter' | 'spring' | 'summer';

export interface GradeMapping {
  letter: string;
  gpa: number | null; // null = excluded from GPA (Pass, NP, etc.)
}

export type GradingScale = GradeMapping[];

export interface Program {
  id: string;
  user_id: string;
  abbreviation: string;
  full_name: string;
  institution: string;
  kind: ProgramKind;
  start_date: string; // ISO date "YYYY-MM-DD"
  end_date: string | null;
  status: LifecycleStatus;
  description: string | null;
  grading_scale: GradingScale;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  program_id: string;
  code: string;
  name: string;
  term_year: number;
  term_season: TermSeason;
  status: LifecycleStatus;
  type: CourseType;
  instructor: string | null;
  credits: number | null;
  grade: string | null;
  syllabus_path: string | null;
  github_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// Form input shapes — what the UI passes to api functions before id/timestamps exist.
export type ProgramInput = Omit<Program, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CourseInput = Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
