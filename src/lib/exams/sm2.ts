export interface Sm2State {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  grade: number;
  nextReviewDate: string;
}

const MIN_EASE_FACTOR = 1.3;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (base: Date, days: number) => {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const normalizeGrade = (grade: number) => {
  if (Number.isNaN(grade)) return 0;
  return Math.max(0, Math.min(5, Math.round(grade)));
};

export const applySm2 = (
  previous: Sm2State | null,
  gradeInput: number,
  reviewedAt = new Date()
): Sm2Result => {
  const grade = normalizeGrade(gradeInput);
  const prevInterval = previous?.intervalDays ?? 1;
  const prevEase = previous?.easeFactor ?? 2.5;
  const prevRepetitions = previous?.repetitions ?? 0;

  let intervalDays = prevInterval;
  let easeFactor = prevEase;
  let repetitions = prevRepetitions;

  if (grade < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(prevInterval * prevEase));
    }
  }

  easeFactor = prevEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  easeFactor = Number(Math.max(MIN_EASE_FACTOR, easeFactor).toFixed(2));

  return {
    grade,
    intervalDays,
    easeFactor,
    repetitions,
    nextReviewDate: toIsoDate(addDays(reviewedAt, intervalDays)),
  };
};
