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
          nom_legal: string | null
          site_web: string | null
          rbq_no: string | null
          neq: string | null
          mode_paiement_defaut: string | null
          delai_paiement: number | null
          notes_pied_devis: string | null
          notes_pied_facture: string | null
          couleur_accent: string | null
          leads_ingest_token: string | null
          marketing_budgets: Json | null
          expenses_inbox_key: string | null
          numero_amf: string | null
          amf_expiration: string | null
          courtier_type: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']> & { name?: string }
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
      jobs: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          titre: string
          description: string | null
          statut: string | null
          date_debut: string | null
          date_fin: string | null
          budget: number | null
          adresse: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['jobs']['Row']> & { company_id: string; titre: string }
        Update: Partial<Database['public']['Tables']['jobs']['Row']>
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
          job_id: string | null
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
      leads: {
        Row: {
          id: string
          company_id: string
          nom: string
          email: string | null
          telephone: string | null
          source: string | null
          statut: string | null
          valeur_estimee: number | null
          score: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & { company_id: string; nom: string }
        Update: Partial<Database['public']['Tables']['leads']['Row']>
      }
      employes: {
        Row: {
          id: string
          company_id: string
          nom: string
          email: string | null
          telephone: string | null
          poste: string | null
          taux_horaire: number | null
          statut: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['employes']['Row']> & { company_id: string; nom: string }
        Update: Partial<Database['public']['Tables']['employes']['Row']>
      }
      depenses: {
        Row: {
          id: string
          company_id: string
          job_id: string | null
          sous_traitant_id: string | null
          description: string
          montant: number
          categorie: string | null
          date_depense: string | null
          source: string | null
          inbound_ref: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['depenses']['Row']> & { company_id: string; description: string; montant: number }
        Update: Partial<Database['public']['Tables']['depenses']['Row']>
      }
      notes: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          job_id: string | null
          auteur_id: string | null
          type: string | null
          contenu: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notes']['Row']> & { company_id: string; contenu: string }
        Update: Partial<Database['public']['Tables']['notes']['Row']>
      }
      invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: string | null
          token: string | null
          accepted: boolean | null
          invited_by: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['invitations']['Row']> & { company_id: string; email: string }
        Update: Partial<Database['public']['Tables']['invitations']['Row']>
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
      sous_traitants: {
        Row: {
          id: string
          company_id: string
          nom: string
          entreprise: string | null
          telephone: string | null
          email: string | null
          rbq_no: string | null
          tps_no: string | null
          tvq_no: string | null
          specialite: string | null
          statut: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['sous_traitants']['Row']> & { company_id: string; nom: string }
        Update: Partial<Database['public']['Tables']['sous_traitants']['Row']>
      }
      relances: {
        Row: {
          id: string
          company_id: string
          devis_id: string | null
          facture_id: string | null
          canal: string
          destinataire: string
          message: string | null
          envoye_le: string | null
        }
        Insert: Partial<Database['public']['Tables']['relances']['Row']> & { company_id: string; destinataire: string }
        Update: Partial<Database['public']['Tables']['relances']['Row']>
      }
      job_assignments: {
        Row: {
          id: string
          company_id: string
          job_id: string
          profile_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['job_assignments']['Row']> & { company_id: string; job_id: string; profile_id: string }
        Update: Partial<Database['public']['Tables']['job_assignments']['Row']>
      }
      job_documents: {
        Row: {
          id: string
          company_id: string
          job_id: string
          type: string
          titre: string
          file_url: string | null
          mime_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['job_documents']['Row']> & { company_id: string; job_id: string; titre: string }
        Update: Partial<Database['public']['Tables']['job_documents']['Row']>
      }
      pointages: {
        Row: {
          id: string
          company_id: string
          job_id: string
          profile_id: string
          date: string
          heure_debut: string
          heure_fin: string | null
          duree_minutes: number | null
          dans_rayon_debut: boolean | null
          dans_rayon_fin: boolean | null
          notes: string | null
          approuve: boolean | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['pointages']['Row']> & { company_id: string; job_id: string; profile_id: string; heure_debut: string }
        Update: Partial<Database['public']['Tables']['pointages']['Row']>
      }
      qc_ccq_entries: {
        Row: {
          id: string
          company_id: string
          job_id: string
          profile_id: string | null
          metier: string
          date: string
          heures: number
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['qc_ccq_entries']['Row']> & { company_id: string; job_id: string; metier: string }
        Update: Partial<Database['public']['Tables']['qc_ccq_entries']['Row']>
      }
      qc_retenues: {
        Row: {
          id: string
          company_id: string
          job_id: string
          sous_traitant_id: string | null
          description: string
          facture_montant: number
          taux_retenue: number
          montant_retenu: number
          montant_paye: number
          statut: string
          date_echeance: string | null
          date_liberation: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['qc_retenues']['Row']> & { company_id: string; job_id: string; description: string; facture_montant: number; montant_retenu: number }
        Update: Partial<Database['public']['Tables']['qc_retenues']['Row']>
      }
      qc_seao_avis: {
        Row: {
          id: string
          company_id: string
          job_id: string | null
          numero_avis: string
          titre: string
          organisme: string | null
          date_publication: string | null
          date_cloture: string | null
          montant_estime: number | null
          statut: string
          url: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['qc_seao_avis']['Row']> & { company_id: string; numero_avis: string; titre: string }
        Update: Partial<Database['public']['Tables']['qc_seao_avis']['Row']>
      }
      preteurs: {
        Row: {
          id: string
          company_id: string
          nom: string
          type: string | null
          contact_nom: string | null
          contact_email: string | null
          contact_tel: string | null
          notes: string | null
          actif: boolean | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['preteurs']['Row']> & { company_id: string; nom: string }
        Update: Partial<Database['public']['Tables']['preteurs']['Row']>
      }
      dossiers: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          preteur_id: string | null
          assigned_to: string | null
          numero: string
          phase: string | null
          etiquette: string | null
          type_transaction: string | null
          montant_pret: number | null
          taux: number | null
          taux_commission: number | null
          commission_brute: number | null
          date_soumission: string | null
          date_approbation: string | null
          date_notariat: string | null
          date_cloture: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['dossiers']['Row']> & { company_id: string }
        Update: Partial<Database['public']['Tables']['dossiers']['Row']>
      }
      commissions: {
        Row: {
          id: string
          company_id: string
          dossier_id: string | null
          preteur_id: string | null
          montant: number
          statut: string | null
          date_prevue: string | null
          date_recue: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['commissions']['Row']> & { company_id: string; montant: number }
        Update: Partial<Database['public']['Tables']['commissions']['Row']>
      }
      dossier_assignments: {
        Row: {
          id: string
          company_id: string
          dossier_id: string
          profile_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['dossier_assignments']['Row']> & { company_id: string; dossier_id: string; profile_id: string }
        Update: Partial<Database['public']['Tables']['dossier_assignments']['Row']>
      }
      dossier_documents: {
        Row: {
          id: string
          company_id: string
          dossier_id: string
          type: string
          titre: string
          recu: boolean | null
          file_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['dossier_documents']['Row']> & { company_id: string; dossier_id: string; type: string; titre: string }
        Update: Partial<Database['public']['Tables']['dossier_documents']['Row']>
      }
      platform_tasks: {
        Row: {
          id: string
          titre: string
          notes: string | null
          statut: string
          priorite: string
          due_date: string | null
          lead_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['platform_tasks']['Row']> & { titre: string }
        Update: Partial<Database['public']['Tables']['platform_tasks']['Row']>
      }
      platform_leads: {
        Row: {
          id: string
          nom: string
          email: string | null
          telephone: string | null
          entreprise: string | null
          source: string | null
          statut: string
          besoin: string | null
          taille_equipe: string | null
          score: number | null
          notes: string | null
          created_at: string
          updated_at: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          abandoned_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['platform_leads']['Row']> & { nom: string }
        Update: Partial<Database['public']['Tables']['platform_leads']['Row']>
      }
      market_trends: {
        Row: {
          id: string
          date_ref: string
          indicateur: string
          valeur: number
          unite: string
          categorie: string
          region: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['market_trends']['Row']> & { date_ref: string; indicateur: string; valeur: number; unite: string; categorie: string }
        Update: Partial<Database['public']['Tables']['market_trends']['Row']>
      }
      calendar_events: {
        Row: {
          id: string
          company_id: string
          titre: string
          type: string
          description: string | null
          date: string
          heure_debut: string | null
          heure_fin: string | null
          client_id: string | null
          job_id: string | null
          employe_id: string | null
          adresse: string | null
          couleur: string | null
          statut: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['calendar_events']['Row']> & { company_id: string; titre: string; date: string }
        Update: Partial<Database['public']['Tables']['calendar_events']['Row']>
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
