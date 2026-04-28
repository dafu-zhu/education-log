import type { Course, GradingScale } from '../types';

/**
 * Compute the GPA for a set of courses against a program's grading scale.
 * Returns null when there are no eligible courses.
 *
 * Eligibility: status === 'completed' AND type === 'credit' AND grade exists
 * in the scale AND that letter's gpa is not null.
 *
 * Weight: course.credits, defaulting to 1 when null.
 */
export function computeGpa(courses: Course[], scale: GradingScale): number | null {
  const lookup = new Map<string, number>();
  for (const { letter, gpa } of scale) {
    if (gpa !== null) lookup.set(letter, gpa);
  }

  let totalPoints = 0;
  let totalWeight = 0;

  for (const c of courses) {
    if (c.status !== 'completed') continue;
    if (c.type !== 'credit') continue;
    if (c.grade === null) continue;
    const gpa = lookup.get(c.grade);
    if (gpa === undefined) continue;

    const weight = c.credits ?? 1;
    totalPoints += gpa * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return totalPoints / totalWeight;
}
