export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  placeholders: string[]
  warnings: string[]
  errors: string[]
}

export const CRITICAL_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
] as const

const PLACEHOLDER_PATTERNS = [
  'placeholder',
  'your-',
  'your_',
  'YOUR_',
  'YOUR-',
  'change_me',
  'changeme',
  'todo',
  'example',
  '00000000-0000-0000-0000-000000000000',
]

function isPlaceholderValue(val: string): boolean {
  const normalized = val.toLowerCase().trim()
  if (!normalized) return true
  return PLACEHOLDER_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase())
  )
}

/**
 * Validates critical runtime environment variables.
 * Checks presence and placeholder detection for:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - STRIPE_SECRET_KEY
 *
 * Logs structured warnings and errors.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = []
  const placeholders: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  const isServer = typeof window === 'undefined'

  for (const key of CRITICAL_ENV_VARS) {
    const isServerOnlyKey = !key.startsWith('NEXT_PUBLIC_')

    // In client browser environment, server-only secret env vars are not exposed by design.
    if (!isServer && isServerOnlyKey) {
      continue
    }

    const value = process.env[key]

    if (!value || value.trim() === '') {
      missing.push(key)
      errors.push(`[ENV ERROR] Critical environment variable is missing: ${key}`)
    } else if (isPlaceholderValue(value)) {
      placeholders.push(key)
      warnings.push(
        `[ENV WARNING] Environment variable ${key} contains a placeholder value.`
      )
    }
  }

  const isValid = missing.length === 0 && placeholders.length === 0

  if (errors.length > 0 || warnings.length > 0) {
    if (typeof console.group === 'function') {
      console.group('⚠️ [Env Validation] Environment Variable Verification Notices:')
    } else {
      console.warn('⚠️ [Env Validation] Environment Variable Verification Notices:')
    }

    for (const err of errors) {
      console.error(err)
    }
    for (const warn of warnings) {
      console.warn(warn)
    }

    if (typeof console.groupEnd === 'function') {
      console.groupEnd()
    }
  } else {
    console.log('✅ [Env Validation] All checked environment variables are present and valid.')
  }

  return {
    isValid,
    missing,
    placeholders,
    warnings,
    errors,
  }
}
