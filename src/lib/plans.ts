export const PLAN_LIMITS = {
  free_trial: {
    name: 'Free Trial',
    price: 0,
    generations: 5,
    diagrams: 5,
    features: [
      '5 AI generations (lifetime)',
      'Up to 5 diagrams',
      'All diagram types',
      'Export PNG / PDF',
      'Public sharing',
    ],
  },
  basic: {
    name: 'Basic',
    price: 20,
    generations: 100,
    diagrams: 50,
    features: [
      '100 AI generations / month',
      'Up to 50 diagrams',
      'API Lens',
      'Export PNG / PDF',
      'Public sharing',
      'Upload doc as context',
    ],
  },
  pro: {
    name: 'Pro',
    price: 50,
    generations: 500,
    diagrams: -1,
    features: [
      '500 AI generations / month',
      'Unlimited diagrams',
      'API Lens',
      'Export all formats',
      'Share & embed',
      'Upload doc as context',
    ],
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
