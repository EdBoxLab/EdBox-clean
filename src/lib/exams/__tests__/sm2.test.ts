import { applySm2 } from '../sm2';

describe('SM-2 scheduler', () => {
  const baselineDate = new Date('2026-04-27T00:00:00.000Z');

  it('schedules first successful review for next day', () => {
    const result = applySm2(null, 5, baselineDate);
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.nextReviewDate).toBe('2026-04-28');
  });

  it('resets interval on failed review', () => {
    const result = applySm2({ intervalDays: 6, easeFactor: 2.5, repetitions: 2 }, 1, baselineDate);
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('increases interval for mature cards', () => {
    const result = applySm2({ intervalDays: 10, easeFactor: 2.5, repetitions: 3 }, 4, baselineDate);
    expect(result.intervalDays).toBe(25);
    expect(result.repetitions).toBe(4);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
