export interface ExamDomain {
  slug: string;
  name: string;
  weight: number;
  questionCount: number;
  readiness: number;
}

export interface ExamConfig {
  slug: string;
  name: string;
  jurisdiction: string[];
  passingScore: number;
  priceCents: number;
  estimatedPrepHours: string;
  totalQuestions: number;
  description: string;
  active: boolean;
  highlights: string[];
  included: string[];
  domains: ExamDomain[];
}

export const examCatalog: ExamConfig[] = [
  {
    slug: 'insurance-us',
    name: 'Insurance Licensing Exam',
    jurisdiction: ['US', 'Canada'],
    passingScore: 70,
    priceCents: 4900,
    estimatedPrepHours: '24-32 hours',
    totalQuestions: 240,
    description:
      'A premium, exam-specific prep kit with a readiness dashboard, adaptive quizzes, Genie explanations, and StudyCast audio.',
    active: true,
    highlights: [
      'Adaptive MCQ engine',
      'AI explanations for wrong answers',
      'Readiness score by domain',
      'StudyCast audio briefs',
    ],
    included: [
      'Domain breakdown with readiness indicators',
      'Adaptive quiz flow with SM-2 scheduling',
      'AI follow-up explanations after mistakes',
      'Mobile-first learning experience',
    ],
    domains: [
      { slug: 'property-insurance', name: 'Property Insurance', weight: 0.25, questionCount: 54, readiness: 38 },
      { slug: 'liability-coverage', name: 'Liability Coverage', weight: 0.2, questionCount: 46, readiness: 52 },
      { slug: 'policy-terms', name: 'Policy Terms & Conditions', weight: 0.3, questionCount: 72, readiness: 68 },
      { slug: 'regulation', name: 'Regulation & Ethics', weight: 0.25, questionCount: 68, readiness: 74 },
    ],
  },
];

export const formatExamPrice = (priceCents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100);

export const getExamBySlug = (slug: string) => examCatalog.find((exam) => exam.slug === slug);

export const getPrimaryExam = () => examCatalog[0];

export const getExamReadinessSummary = (exam: ExamConfig) => {
  const averageReadiness = Math.round(
    exam.domains.reduce((sum, domain) => sum + domain.readiness, 0) / exam.domains.length
  );
  const weakestDomain = [...exam.domains].sort((left, right) => left.readiness - right.readiness)[0];

  return {
    averageReadiness,
    weakestDomain,
  };
};

export const getDomainBySlug = (exam: ExamConfig, domainSlug: string) =>
  exam.domains.find((domain) => domain.slug === domainSlug);