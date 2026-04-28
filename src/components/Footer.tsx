import { useAuth } from '../auth/AuthProvider';
import type { Course, Program } from '../types';

interface Props {
  programs: Program[];
  courses: Course[];
}

function maxUpdatedAt(programs: Program[], courses: Course[]): string | null {
  const all = [...programs.map((p) => p.updated_at), ...courses.map((c) => c.updated_at)];
  if (all.length === 0) return null;
  return all.sort().at(-1) ?? null;
}

export function Footer({ programs, courses }: Props) {
  const { signOut } = useAuth();
  const last = maxUpdatedAt(programs, courses);
  const lastDate = last ? new Date(last).toISOString().slice(0, 10) : '—';
  return (
    <footer className="footer">
      <span>Last updated {lastDate}</span>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          void signOut();
        }}
      >
        Log out
      </a>
    </footer>
  );
}
