import { useState, useEffect } from 'react';
import type { Course } from '../types';
import { PdfIcon, GitHubIcon, GlobeIcon, EditIcon } from './icons';
import { getSyllabusUrl } from '../api/storage';

interface Props {
  course: Course;
  onEdit: () => void;
}

const seasonLabel: Record<string, string> = {
  fall: 'Fall',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
};

const typeBadge: Record<string, string | null> = {
  credit: null,
  audit: 'audit',
  self_study: 'self-study',
};

export function CourseRow({ course, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [syllabusUrl, setSyllabusUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!course.syllabus_path) {
      setSyllabusUrl(null);
      return;
    }
    let cancelled = false;
    getSyllabusUrl(course.syllabus_path)
      .then((u) => {
        if (!cancelled) setSyllabusUrl(u);
      })
      .catch(() => {
        if (!cancelled) setSyllabusUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [course.syllabus_path]);

  const term = `${seasonLabel[course.term_season]} ${course.term_year}`;
  const badge = typeBadge[course.type];

  const gradeCell =
    course.status === 'planned' ? (
      <span>planned</span>
    ) : course.status === 'in_progress' ? (
      <span>in progress</span>
    ) : course.grade ? (
      <>
        <span>{course.grade}</span>
        {course.credits != null && <span className="small">{course.credits} cr</span>}
      </>
    ) : (
      <span>—</span>
    );

  return (
    <>
      <li
        className={`course-row ${course.status === 'planned' ? 'planned' : ''} ${
          course.status === 'in_progress' ? 'in-progress' : ''
        }`}
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="course-code">{course.code}</div>
        <div>
          <span className="course-name">{course.name}</span>
          {badge && <span className="course-instructor"> · {badge}</span>}
        </div>
        <div className="course-term">{term}</div>
        <div className="course-grade">
          {gradeCell}
          <span className="course-icons" onClick={(e) => e.stopPropagation()}>
            {syllabusUrl && (
              <a href={syllabusUrl} target="_blank" rel="noreferrer">
                <PdfIcon />
              </a>
            )}
            {course.website_url && (
              <a href={course.website_url} target="_blank" rel="noreferrer">
                <GlobeIcon />
              </a>
            )}
            {course.github_url && (
              <a href={course.github_url} target="_blank" rel="noreferrer">
                <GitHubIcon />
              </a>
            )}
            <button
              className="course-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="edit course"
            >
              <EditIcon />
            </button>
          </span>
        </div>
      </li>
      {expanded &&
        (course.instructor ||
          course.note ||
          syllabusUrl ||
          course.website_url ||
          course.github_url) && (
          <li className="course-detail">
            {course.instructor && (
              <p>
                <em>Instructor:</em> {course.instructor}
              </p>
            )}
            {course.note && <p>{course.note}</p>}
            {syllabusUrl && (
              <p>
                <a href={syllabusUrl} target="_blank" rel="noreferrer">
                  Open syllabus PDF
                </a>
              </p>
            )}
            {course.website_url && (
              <p>
                <a href={course.website_url} target="_blank" rel="noreferrer">
                  {course.website_url}
                </a>
              </p>
            )}
            {course.github_url && (
              <p>
                <a href={course.github_url} target="_blank" rel="noreferrer">
                  {course.github_url}
                </a>
              </p>
            )}
          </li>
        )}
    </>
  );
}
