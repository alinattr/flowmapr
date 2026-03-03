export const PLAN_LIMITS = {
  free_trial: {
    name: 'Free Trial',
    price: 0,
    generations: 5,
    features: [
      'Generate up to 5 diagrams',
      'All diagram types',
      'Export PNG / PDF',
    ],
  },
  basic: {
    name: 'Basic',
    price: 20,
    generations: 100,
    features: [
      'Generate up to 100 diagrams',
      'API Lens',
      'Code Lens',
      'Export PNG / PDF',
      'Public sharing',
    ],
  },
  pro: {
    name: 'Pro',
    price: 50,
    generations: 500,
    features: [
      'Generate up to 500 diagrams',
      'API Lens',
      'Code Lens',
      'Export PNG / PDF',
      'Public sharing',
      'Share & embed',
      'Export to GitHub / Notion / Confluence',
    ],
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
