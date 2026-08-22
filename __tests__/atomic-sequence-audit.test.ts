import { describe, it, expect, vi } from 'vitest'
import { generateNextDocumentNumber } from '@/lib/api/sequence'

describe('Séquenceur Atomique de Documents (Factures / Devis)', () => {
  it('respecte un numéro personnalisé s’il est fourni', async () => {
    const mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(),
    } as any

    const num = await generateNextDocumentNumber(mockSupabase, 'comp-1', 'facture', 'FAC-CUSTOM-007')
    expect(num).toBe('FAC-CUSTOM-007')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('appelle la RPC get_next_document_number en priorité', async () => {
    const year = new Date().getFullYear()
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: `FAC-${year}-042`, error: null }),
      from: vi.fn(),
    } as any

    const num = await generateNextDocumentNumber(mockSupabase, 'comp-1', 'facture')
    expect(num).toBe(`FAC-${year}-042`)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_next_document_number', {
      p_company_id: 'comp-1',
      p_doc_type: 'facture',
      p_year: year,
      p_prefix: 'FAC',
    })
  })

  it('bascule de manière transparente sur le fallback count si la RPC échoue', async () => {
    const year = new Date().getFullYear()
    const mockSupabase = {
      rpc: vi.fn().mockRejectedValue(new Error('RPC unavailable')),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            like: vi.fn().mockResolvedValue({ count: 5 }),
          }),
        }),
      }),
    } as any

    const num = await generateNextDocumentNumber(mockSupabase, 'comp-1', 'devis')
    expect(num).toBe(`DEV-${year}-006`)
  })
})
