import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error

    return NextResponse.json({ success: true, deletedId: id })
  } catch (err) {
    return apiError(err, '[DELETE /api/leads/[id]]')
  }
}
