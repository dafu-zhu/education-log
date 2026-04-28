import type { GradingScale } from '../types';

export interface GradingScalePreset {
  id: string;
  label: string;
  scale: GradingScale;
}

export const GRADING_SCALE_PRESETS: GradingScalePreset[] = [
  {
    id: 'us-standard-4',
    label: 'US Standard 4.0',
    scale: [
      { letter: 'A', gpa: 4.0 },
      { letter: 'A-', gpa: 3.7 },
      { letter: 'B+', gpa: 3.3 },
      { letter: 'B', gpa: 3.0 },
      { letter: 'B-', gpa: 2.7 },
      { letter: 'C+', gpa: 2.3 },
      { letter: 'C', gpa: 2.0 },
      { letter: 'C-', gpa: 1.7 },
      { letter: 'D+', gpa: 1.3 },
      { letter: 'D', gpa: 1.0 },
      { letter: 'F', gpa: 0.0 },
    ],
  },
  {
    id: 'plus-weighted-4-33',
    label: 'Plus-weighted 4.33 (with A+)',
    scale: [
      { letter: 'A+', gpa: 4.33 },
      { letter: 'A', gpa: 4.0 },
      { letter: 'A-', gpa: 3.67 },
      { letter: 'B+', gpa: 3.33 },
      { letter: 'B', gpa: 3.0 },
      { letter: 'B-', gpa: 2.67 },
      { letter: 'C+', gpa: 2.33 },
      { letter: 'C', gpa: 2.0 },
      { letter: 'C-', gpa: 1.67 },
      { letter: 'D+', gpa: 1.33 },
      { letter: 'D', gpa: 1.0 },
      { letter: 'F', gpa: 0.0 },
    ],
  },
  {
    id: 'pass-fail',
    label: 'Pass / Fail',
    scale: [
      { letter: 'P', gpa: null },
      { letter: 'NP', gpa: null },
    ],
  },
  {
    id: 'custom',
    label: 'Custom (blank)',
    scale: [],
  },
];
