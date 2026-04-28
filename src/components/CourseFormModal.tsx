import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Modal } from './Modal';
import { deleteSyllabus } from '../api/storage';
import type {
  Course,
  CourseInput,
  CourseType,
  LifecycleStatus,
  Program,
  TermSeason,
} from '../types';

interface Props {
  program: Program;
  initial?: Course | null;
  onSubmit: (input: CourseInput, pdf: File | null, removePdf: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const SEASONS: TermSeason[] = ['fall', 'winter', 'spring', 'summer'];
const SEASON_LABEL: Record<TermSeason, string> = {
  fall: 'Fall',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
};

const blank = (programId: string): CourseInput => ({
  program_id: programId,
  code: '',
  name: '',
  term_year: new Date().getFullYear(),
  term_season: 'fall',
  status: 'planned',
  type: 'credit',
  instructor: null,
  credits: null,
  grade: null,
  syllabus_path: null,
  github_url: null,
  note: null,
});

export function CourseFormModal({ program, initial, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<CourseInput>(() => {
    if (!initial) return blank(program.id);
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = initial;
    void _id;
    void _u;
    void _c;
    void _up;
    return rest;
  });
  const [pdf, setPdf] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CourseInput>(key: K, val: CourseInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const gradeable = form.type === 'credit' && form.status === 'completed';
  const gradeOptions = program.grading_scale.map((g) => g.letter);

  const onPdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPdf(f);
    setRemovePdf(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form, pdf, removePdf);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm('Delete this course?')) return;
    setBusy(true);
    try {
      if (initial?.syllabus_path) {
        await deleteSyllabus(initial.syllabus_path).catch(() => undefined);
      }
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit course' : 'Add course'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-row">
          <label>
            code *
            <input value={form.code} onChange={(e) => set('code', e.target.value)} required />
          </label>
          <label>
            credits
            <input
              type="number"
              step="0.5"
              value={form.credits ?? ''}
              onChange={(e) =>
                set('credits', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </label>
        </div>

        <label>
          name *
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>

        <div className="modal-row">
          <label>
            year *
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.term_year}
              onChange={(e) => set('term_year', Number(e.target.value))}
              required
            />
          </label>
          <label>
            season *
            <select
              value={form.term_season}
              onChange={(e) => set('term_season', e.target.value as TermSeason)}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-row">
          <label>
            status *
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as LifecycleStatus)}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            type *
            <select value={form.type} onChange={(e) => set('type', e.target.value as CourseType)}>
              <option value="credit">Credit</option>
              <option value="audit">Audit</option>
              <option value="self_study">Self-study</option>
            </select>
          </label>
        </div>

        <div className="modal-row">
          <label>
            instructor
            <input
              value={form.instructor ?? ''}
              onChange={(e) => set('instructor', e.target.value || null)}
            />
          </label>
          <label>
            grade {gradeable ? '' : '(N/A)'}
            <select
              value={form.grade ?? ''}
              onChange={(e) => set('grade', e.target.value || null)}
              disabled={!gradeable}
            >
              <option value="">—</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          github URL
          <input
            type="url"
            value={form.github_url ?? ''}
            onChange={(e) => set('github_url', e.target.value || null)}
          />
        </label>

        <label>
          note (one line)
          <input value={form.note ?? ''} onChange={(e) => set('note', e.target.value || null)} />
        </label>

        <label>
          syllabus PDF
          <input type="file" accept="application/pdf" onChange={onPdfChange} />
          {form.syllabus_path && !pdf && !removePdf && (
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Current PDF on file.{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRemovePdf(true);
                }}
              >
                remove
              </a>
            </span>
          )}
          {removePdf && (
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>Will be removed on save.</span>
          )}
        </label>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          {initial && onDelete && (
            <button type="button" className="danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
