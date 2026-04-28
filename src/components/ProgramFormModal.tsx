import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { GradingScaleEditor } from './GradingScaleEditor';
import type {
  Program,
  ProgramInput,
  ProgramKind,
  LifecycleStatus,
  GradingScale,
} from '../types';

interface Props {
  initial?: Program | null;
  onSubmit: (input: ProgramInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const blank = (): ProgramInput => ({
  abbreviation: '',
  full_name: '',
  institution: '',
  kind: 'degree',
  start_date: '',
  end_date: null,
  status: 'planned',
  description: null,
  grading_scale: [],
  display_order: 0,
});

export function ProgramFormModal({ initial, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<ProgramInput>(() => {
    if (!initial) return blank();
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = initial;
    void _id;
    void _u;
    void _c;
    void _up;
    return rest;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProgramInput>(key: K, val: ProgramInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm('Delete this program AND all its courses? This cannot be undone.')) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit program' : 'Add program'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-row">
          <label>
            abbreviation *
            <input
              value={form.abbreviation}
              onChange={(e) => set('abbreviation', e.target.value)}
              required
            />
          </label>
          <label>
            kind *
            <select value={form.kind} onChange={(e) => set('kind', e.target.value as ProgramKind)}>
              <option value="degree">Degree</option>
              <option value="certificate">Certificate</option>
            </select>
          </label>
        </div>

        <label>
          full name *
          <input
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            required
          />
        </label>
        <label>
          institution *
          <input
            value={form.institution}
            onChange={(e) => set('institution', e.target.value)}
            required
          />
        </label>

        <div className="modal-row">
          <label>
            start date *
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}-\d{2}-\d{2}"
              placeholder="YYYY-MM-DD"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              required
            />
          </label>
          <label>
            end date
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}-\d{2}-\d{2}"
              placeholder="YYYY-MM-DD (blank if ongoing)"
              value={form.end_date ?? ''}
              onChange={(e) => set('end_date', e.target.value || null)}
            />
          </label>
        </div>

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
          description
          <textarea
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </label>

        <hr />
        <h3
          style={{
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: 'var(--ink-faint)',
          }}
        >
          grading scale
        </h3>
        <GradingScaleEditor
          value={form.grading_scale}
          onChange={(next: GradingScale) => set('grading_scale', next)}
        />

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          {initial && onDelete && (
            <button type="button" className="danger" onClick={remove} disabled={busy}>
              Delete program
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
