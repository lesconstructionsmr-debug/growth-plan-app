import { ApiError, requireCompany } from './auth'
import { getAssignedJobIds, isCompanyAdmin } from '@/lib/auth/permissions'

export async function requireJobAccess(jobId: string) {
  const ctx = await requireCompany()

  const { data: job, error } = await ctx.supabase
    .from('jobs')
    .select('id, company_id, client_id, titre, statut')
    .eq('id', jobId)
    .eq('company_id', ctx.companyId)
    .maybeSingle()

  if (error) throw error
  if (!job) throw new ApiError(404, 'Chantier introuvable')

  if (!isCompanyAdmin(ctx.role)) {
    const assignedIds = await getAssignedJobIds(ctx.supabase, ctx.user.id, ctx.companyId)
    if (!assignedIds?.includes(jobId)) {
      throw new ApiError(403, 'Accès refusé à ce chantier')
    }
  }

  return { ...ctx, job }
}
