export const PLANS = {
  free: {
    generation_limit: 3,
    features: [
      'all_diagram_types',
      'export_png_pdf',
      'explain_diagram',
      'guided_onboarding',
    ],
  },
  basic: {
    generation_limit: 100,
    features: [
      'all_diagram_types',
      'api_lens',
      'export_png_pdf',
      'explain_diagram',
      'update_diagram_ai',
      'version_history',
      'public_sharing',
      'guided_onboarding',
    ],
  },
  pro: {
    generation_limit: 500,
    features: [
      'all_diagram_types',
      'api_lens',
      'code_lens',
      'export_png_pdf',
      'explain_diagram',
      'update_diagram_ai',
      'version_history',
      'export_github_notion_confluence',
      'public_sharing',
      'share_embed',
      'guided_onboarding',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function normalizePlan(plan: string | null | undefined): PlanKey {
  if (plan === 'pro') return 'pro'
  if (plan === 'basic') return 'basic'
  return 'free'
}
