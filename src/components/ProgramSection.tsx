import { useState } from 'react';
import type { Course, Program, CourseInput } from '../types';
import { ProgramHeader } from './ProgramHeader';
import { CourseRow } from './CourseRow';
import { ProgramFormModal } from './ProgramFormModal';
import { CourseFormModal } from './CourseFormModal';
import { computeGpa } from '../lib/gpa';
import { createCourse, updateCourse, deleteCourse } from '../api/courses';
import { updateProgram, deleteProgram } from '../api/programs';
import { uploadSyllabus, deleteSyllabus } from '../api/storage';
import { PlusIcon } from './icons';

interface Props {
  program: Program;
  courses: Course[];
  reload: () => Promise<void>;
}

const seasonOrder = { autumn: 0, winter: 1, spring: 2, summer: 3 } as const;

export function ProgramSection({ program, courses, reload }: Props) {
  const [editingProgram, setEditingProgram] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const sortedCourses = [...courses].sort((a, b) => {
    if (a.term_year !== b.term_year) return a.term_year - b.term_year;
    return seasonOrder[a.term_season] - seasonOrder[b.term_season];
  });

  const gpa = computeGpa(courses, program.grading_scale);

  const onSubmitCourse = async (input: CourseInput, pdf: File | null, removePdf: boolean) => {
    if (editingCourse) {
      const patch: Partial<CourseInput> = { ...input };
      if (removePdf && editingCourse.syllabus_path) {
        await deleteSyllabus(editingCourse.syllabus_path).catch(() => undefined);
        patch.syllabus_path = null;
      }
      const updated = await updateCourse(editingCourse.id, patch);
      if (pdf) {
        const path = await uploadSyllabus(updated.id, pdf);
        await updateCourse(updated.id, { syllabus_path: path });
      }
    } else {
      const created = await createCourse(input);
      if (pdf) {
        const path = await uploadSyllabus(created.id, pdf);
        await updateCourse(created.id, { syllabus_path: path });
      }
    }
    await reload();
  };

  return (
    <section className="program-section">
      <ProgramHeader program={program} gpa={gpa} onEdit={() => setEditingProgram(true)} />

      {sortedCourses.length === 0 ? (
        <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--ink-faint)' }}>
          No courses added yet.
        </p>
      ) : (
        <ul className="course-list">
          {sortedCourses.map((c) => (
            <CourseRow key={c.id} course={c} onEdit={() => setEditingCourse(c)} />
          ))}
        </ul>
      )}

      <button onClick={() => setAddingCourse(true)} style={{ marginTop: 16 }}>
        <PlusIcon /> Add course
      </button>

      {editingProgram && (
        <ProgramFormModal
          initial={program}
          onSubmit={async (input) => {
            await updateProgram(program.id, input);
            await reload();
          }}
          onDelete={async () => {
            await deleteProgram(program.id);
            await reload();
          }}
          onClose={() => setEditingProgram(false)}
        />
      )}

      {addingCourse && (
        <CourseFormModal
          program={program}
          onSubmit={onSubmitCourse}
          onClose={() => setAddingCourse(false)}
        />
      )}

      {editingCourse && (
        <CourseFormModal
          program={program}
          initial={editingCourse}
          onSubmit={onSubmitCourse}
          onDelete={async () => {
            await deleteCourse(editingCourse.id);
            await reload();
          }}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </section>
  );
}
