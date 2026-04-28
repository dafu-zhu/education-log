import { useState } from 'react';
import type { Course, Program, CourseInput } from '../types';
import { ProgramHeader } from './ProgramHeader';
import { CourseRow } from './CourseRow';
import { ProgramFormModal } from './ProgramFormModal';
import { CourseFormModal } from './CourseFormModal';
import { computeGpa } from '../lib/gpa';
import { createCourse, updateCourse, deleteCourse } from '../api/courses';
import { updateProgram, deleteProgram } from '../api/programs';
import { uploadSyllabus, deleteSyllabus, moveSyllabusForCodeChange } from '../api/storage';
import { PlusIcon } from './icons';

interface Props {
  program: Program;
  courses: Course[];
  reload: () => Promise<void>;
}

const seasonOrder = { fall: 0, winter: 1, spring: 2, summer: 3 } as const;

export function ProgramSection({ program, courses, reload }: Props) {
  const [editingProgram, setEditingProgram] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const sortedCourses = [...courses].sort((a, b) => {
    if (a.term_year !== b.term_year) return a.term_year - b.term_year;
    if (a.term_season !== b.term_season) {
      return seasonOrder[a.term_season] - seasonOrder[b.term_season];
    }
    return a.code.localeCompare(b.code);
  });

  const gpa = computeGpa(courses, program.grading_scale);

  const onSubmitCourse = async (input: CourseInput, pdf: File | null, removePdf: boolean) => {
    if (editingCourse) {
      const patch: Partial<CourseInput> = { ...input };

      if (removePdf && editingCourse.syllabus_path) {
        await deleteSyllabus(editingCourse.syllabus_path).catch(() => undefined);
        patch.syllabus_path = null;
      } else if (pdf) {
        // New upload — delete the old file first if one exists.
        if (editingCourse.syllabus_path) {
          await deleteSyllabus(editingCourse.syllabus_path).catch(() => undefined);
        }
        patch.syllabus_path = await uploadSyllabus(editingCourse.id, input.code, pdf);
      } else if (editingCourse.code !== input.code && editingCourse.syllabus_path) {
        // No new file, but code changed — rename the existing file so the path
        // stays consistent with the (lowered) code.
        patch.syllabus_path = await moveSyllabusForCodeChange(
          editingCourse.syllabus_path,
          editingCourse.id,
          input.code,
        );
      }

      await updateCourse(editingCourse.id, patch);
    } else {
      const created = await createCourse(input);
      if (pdf) {
        const path = await uploadSyllabus(created.id, input.code, pdf);
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
