import { useCallback, useEffect, useState } from 'react';
import type { Course, Program } from '../types';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProgramSection } from '../components/ProgramSection';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { listPrograms, createProgram } from '../api/programs';
import { listCourses } from '../api/courses';

export function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [ps, cs] = await Promise.all([listPrograms(), listCourses()]);
      setPrograms(ps);
      setCourses(cs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) return null;

  return (
    <div className="page">
      <Header programs={programs} courses={courses} onAddProgram={() => setAdding(true)} />

      {error && <p className="login-error">{error}</p>}

      {programs.length === 0 ? (
        <div className="empty">
          <p>Add your first program to get started.</p>
          <button onClick={() => setAdding(true)}>+ Add program</button>
        </div>
      ) : (
        programs.map((p) => (
          <ProgramSection
            key={p.id}
            program={p}
            courses={courses.filter((c) => c.program_id === p.id)}
            reload={reload}
          />
        ))
      )}

      <Footer programs={programs} courses={courses} />

      {adding && (
        <ProgramFormModal
          onSubmit={async (input) => {
            await createProgram(input);
            await reload();
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
