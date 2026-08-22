import { SupabaseClient } from '@supabase/supabase-js'

export async function generateNextDocumentNumber(
  supabase: SupabaseClient,
  companyId: string,
  docType: 'facture' | 'devis',
  customNumero?: string
): Promise<string> {
  if (customNumero && customNumero.trim().length > 0) {
    return customNumero.trim()
  }

  const year = new Date().getFullYear()
  const prefix = docType === 'facture' ? 'FAC' : 'DEV'

  try {
    const { data, error } = await supabase.rpc('get_next_document_number', {
      p_company_id: companyId,
      p_doc_type: docType,
      p_year: year,
      p_prefix: prefix,
    })

    if (!error && data) {
      return data as string
    }
  } catch {
    // Fallback if RPC is unavailable
  }

  // Fallback: exact count with sequence padding
  const tableName = docType === 'facture' ? 'factures' : 'devis'
  const { count: existingCount } = await supabase
    .from(tableName)
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .like('numero', `${prefix}-${year}-%`)

  const seqNum = String((existingCount ?? 0) + 1).padStart(3, '0')
  return `${prefix}-${year}-${seqNum}`
}
