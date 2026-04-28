import { describe, it, expect } from 'vitest';
import { computeGpa } from '../src/lib/gpa';
import type { Course, GradingScale } from '../src/types';

const usStandard: GradingScale = [
  { letter: 'A', gpa: 4.0 },
  { letter: 'A-', gpa: 3.7 },
  { letter: 'B+', gpa: 3.3 },
  { letter: 'B', gpa: 3.0 },
  { letter: 'P', gpa: null },
  { letter: 'F', gpa: 0.0 },
];

const make = (overrides: Partial<Course>): Course => ({
  id: 'c',
  user_id: 'u',
  program_id: 'p',
  code: 'X 100',
  name: 'X',
  term_year: 2023,
  term_season: 'fall',
  status: 'completed',
  type: 'credit',
  instructor: null,
  credits: 100,
  grade: 'A',
  syllabus_path: null,
  github_url: null,
  note: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('computeGpa', () => {
  it('returns null when there are no eligible courses', () => {
    expect(computeGpa([], usStandard)).toBeNull();
  });

  it('returns the single grade when only one credited completed course exists', () => {
    expect(computeGpa([make({ grade: 'A-' })], usStandard)).toBeCloseTo(3.7);
  });

  it('weights by credits when computing the average', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }), // 4.0 * 100 = 400
      make({ id: '2', grade: 'B', credits: 50 }), //  3.0 *  50 = 150
    ]; // total = 550 / 150 credits ≈ 3.6667
    expect(computeGpa(courses, usStandard)).toBeCloseTo(3.6667, 3);
  });

  it('treats null credits as weight 1', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: null }), // 4.0 * 1
      make({ id: '2', grade: 'B', credits: null }), // 3.0 * 1
    ]; // (4 + 3) / 2 = 3.5
    expect(computeGpa(courses, usStandard)).toBe(3.5);
  });

  it('excludes courses whose grade maps to null gpa (Pass)', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'P', credits: 100 }), // excluded entirely
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with type !== credit', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'A', credits: 100, type: 'audit' }),
      make({ id: '3', grade: 'A', credits: 100, type: 'self_study' }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with status !== completed', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'A', credits: 100, status: 'in_progress' }),
      make({ id: '3', grade: 'A', credits: 100, status: 'planned' }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with null grade', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: null, credits: 100 }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with a grade not in the scale', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'XYZ', credits: 100 }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });
});
