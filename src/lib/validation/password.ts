export interface PasswordStrength {
  score: number        // 0-4
  label: string
  color: string
  issues: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else issues.push('At least 8 characters')

  if (/[A-Z]/.test(password)) score++
  else issues.push('One uppercase letter')

  if (/[0-9]/.test(password)) score++
  else issues.push('One number')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else issues.push('One special character')

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981']

  return {
    score,
    label: labels[score],
    color: colors[score],
    issues,
  }
}
