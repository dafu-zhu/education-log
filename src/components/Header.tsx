import type { Course, Program } from '../types';
import { PlusIcon } from './icons';

interface Props {
  programs: Program[];
  courses: Course[];
  onAddProgram: () => void;
}

export function Header({ programs, courses, onAddProgram }: Props) {
  const inProgress = courses.filter((c) => c.status === 'in_progress').length;
  const planned = courses.filter((c) => c.status === 'planned').length;

  return (
    <header className="header">
      <h1 className="header-name">Education Log</h1>
      <div className="header-stats">
        <span>{programs.length} programs</span>
        <span>·</span>
        <span>{courses.length} courses</span>
        {inProgress > 0 && (
          <>
            <span>·</span>
            <span>{inProgress} in progress</span>
          </>
        )}
        {planned > 0 && (
          <>
            <span>·</span>
            <span>{planned} planned</span>
          </>
        )}
        <button onClick={onAddProgram}>
          <PlusIcon /> Add program
        </button>
      </div>
    </header>
  );
}
