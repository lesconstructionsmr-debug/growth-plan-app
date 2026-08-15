/**
 * Types Supabase générés manuellement depuis supabase/migrations/.
 * Regénérer avec : npx supabase gen types typescript --project-id <id> > lib/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type StatutDevisDb =
  | 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'refuse' | 'expire' | 'converti'

export type StatutFactureDb =
  | 'brouillon' | 'envoyee' | 'vue' | 'partielle' | 'payee' | 'en_retard' | 'annulee'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          telephone: string | null
          adresse: string | null
          ville: string | null
          province: string | null
          code_postal: string | null
          tps_no: string | null
          tvq_no: string | null
          logo_url: string | null
          vertical: string | null
          team_size: string | null
          email: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['companies']['Row']>
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          full_name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      clients: {
        Row: {
          id: string
          company_id: string
          nom: string
          email: string | null
          telephone: string | null
          adresse: string | null
          ville: string | null
          province: string | null
          code_postal: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['clients']['Row']> & { company_id: string; nom: string }
        Update: Partial<Database['public']['Tables']['clients']['Row']>
      }
      devis: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          job_id: string | null
          numero: string
          titre: string | null
          statut: StatutDevisDb
          lignes: Json
          montant_ht: number
          tps: number
          tvq: number
          montant_ttc: number
          notes: string | null
          notes_internes: string | null
          reference_projet: string | null
          date_emission: string
          valide_jusqu_au: string | null
          envoye_le: string | null
          approuve_le: string | null
          portal_token: string | null
          signature_data: string | null
          signe_le: string | null
          signataire_nom: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['devis']['Row']> & { company_id: string; numero: string }
        Update: Partial<Database['public']['Tables']['devis']['Row']>
      }
      factures: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          devis_id: string | null
          numero: string
          titre: string | null
          statut: StatutFactureDb
          lignes: Json
          montant_ht: number
          tps: number
          tvq: number
          montant_ttc: number
          date_emission: string
          date_echeance: string | null
          date_paiement: string | null
          mode_reglement: string | null
          notes: string | null
          notes_internes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['factures']['Row']> & { company_id: string; numero: string }
        Update: Partial<Database['public']['Tables']['factures']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          company_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string | null
          plan: string | null
          trial_end: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
    }
    Functions: {
      portal_get_devis: {
        Args: { p_token: string }
        Returns: Json
      }
      portal_update_devis: {
        Args: {
          p_token: string
          p_action: string
          p_motif?: string | null
          p_signature_data?: string | null
          p_signataire_nom?: string | null
        }
        Returns: Json
      }
    }
    Views: Record<string, never>
    Enums: Record<string, never>
  }
}
