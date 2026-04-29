import { examCatalog, formatExamPrice, getDomainBySlug, getExamBySlug, getPrimaryExam } from '../catalog';

describe('exam catalog', () => {
  it('returns the primary insurance exam config', () => {
    expect(getPrimaryExam()).toBe(examCatalog[0]);
    expect(getExamBySlug('insurance-us')).toBe(examCatalog[0]);
  });

  it('formats the launch price in dollars', () => {
    expect(formatExamPrice(4900)).toBe('$49.00');
  });

  it('returns undefined for unknown exams', () => {
    expect(getExamBySlug('unknown')).toBeUndefined();
  });

  it('finds a domain by slug', () => {
    const exam = examCatalog[0];
    expect(getDomainBySlug(exam, 'property-insurance')?.name).toBe('Property Insurance');
  });
});