/** Logique pure pour lier un abonnement Stripe à un company_id */

export interface SubscriptionLookupContext {
  existingCompanyId?: string | null
  emailCompanyId?: string | null
}

export interface StripeSubMetadata {
  metadata?: Record<string, string>
  customer?: string
  customer_email?: string | null
}

export function resolveCompanyIdFromSubscription(
  sub: StripeSubMetadata,
  ctx: SubscriptionLookupContext = {}
): string | null {
  if (sub.metadata?.company_id) return sub.metadata.company_id
  if (ctx.existingCompanyId) return ctx.existingCompanyId
  if (ctx.emailCompanyId) return ctx.emailCompanyId
  return null
}
