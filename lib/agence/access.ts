import { ApiError, requireAgenceAccess } from '@/lib/api/auth'
import { getAssignedDossierIds, isCompanyAdmin } from '@/lib/auth/permissions'

export async function requireDossierAccess(dossierId: string) {
  const ctx = await requireAgenceAccess()

  const { data: dossier, error } = await ctx.supabase
    .from('dossiers')
    .select('id, company_id, client_id, numero, phase, etiquette, montant_pret, taux_commission, preteur_id')
    .eq('id', dossierId)
    .eq('company_id', ctx.companyId)
    .maybeSingle()

  if (error) throw error
  if (!dossier) throw new ApiError(404, 'Dossier introuvable')

  if (!isCompanyAdmin(ctx.role)) {
    const assignedIds = await getAssignedDossierIds(ctx.supabase, ctx.user.id, ctx.companyId)
    if (!assignedIds?.includes(dossierId)) {
      throw new ApiError(403, 'Accès refusé à ce dossier')
    }
  }

  return { ...ctx, dossier }
}
