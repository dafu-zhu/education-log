import type { Program } from '../types';
import { EditIcon } from './icons';

interface Props {
  program: Program;
  gpa: number | null;
  onEdit: () => void;
}

function formatDates(p: Program): string {
  const startYear = new Date(p.start_date).getFullYear();
  if (p.status === 'planned') return 'planned';
  if (p.status === 'in_progress') return `${startYear} – present`;
  if (!p.end_date) return `${startYear}`;
  const endYear = new Date(p.end_date).getFullYear();
  return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
}

export function ProgramHeader({ program, gpa, onEdit }: Props) {
  const kindLabel = program.kind === 'degree' ? 'Degree' : 'Certificate';
  const dates = formatDates(program);
  const gpaStr = gpa !== null ? `GPA ${gpa.toFixed(2)}` : null;

  return (
    <div>
      <div className="program-header">
        <span className="program-abbr">{program.abbreviation}</span>
        <span className="program-meta">
          {kindLabel} · {dates}
          {gpaStr && ` · ${gpaStr}`}
        </span>
        <button className="program-edit" onClick={onEdit} aria-label="edit program">
          <EditIcon />
        </button>
      </div>
      <p className="program-fullname">{program.full_name}</p>
      <div className="program-institution">{program.institution}</div>
      {program.description && <p className="program-description">{program.description}</p>}
    </div>
  );
}
