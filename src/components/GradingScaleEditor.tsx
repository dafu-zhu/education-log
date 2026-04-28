import type { GradingScale } from '../types';
import { GRADING_SCALE_PRESETS } from '../lib/grading-scales';

interface Props {
  value: GradingScale;
  onChange: (next: GradingScale) => void;
}

export function GradingScaleEditor({ value, onChange }: Props) {
  const applyPreset = (presetId: string) => {
    const preset = GRADING_SCALE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange(preset.scale.map((row) => ({ ...row })));
  };

  const updateRow = (i: number, patch: Partial<{ letter: string; gpa: number | null }>) => {
    const next = value.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => onChange([...value, { letter: '', gpa: 0 }]);
  const removeRow = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <label>
        start from template
        <select onChange={(e) => applyPreset(e.target.value)} defaultValue="">
          <option value="" disabled>
            choose a template…
          </option>
          {GRADING_SCALE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                fontSize: 11,
                color: 'var(--ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                paddingBottom: 6,
              }}
            >
              letter
            </th>
            <th
              style={{
                textAlign: 'left',
                fontSize: 11,
                color: 'var(--ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                paddingBottom: 6,
              }}
            >
              gpa (blank = excluded)
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {value.map((row, i) => (
            <tr key={i}>
              <td style={{ paddingRight: 8, paddingBottom: 4 }}>
                <input
                  type="text"
                  value={row.letter}
                  onChange={(e) => updateRow(i, { letter: e.target.value })}
                  required
                />
              </td>
              <td style={{ paddingRight: 8, paddingBottom: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={row.gpa ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRow(i, { gpa: v === '' ? null : Number(v) });
                  }}
                />
              </td>
              <td style={{ paddingBottom: 4 }}>
                <button type="button" onClick={() => removeRow(i)} style={{ padding: '4px 10px' }}>
                  remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} style={{ marginTop: 12 }}>
        + add row
      </button>
    </div>
  );
}
