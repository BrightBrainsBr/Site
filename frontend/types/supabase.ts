// frontend/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          contact_email: string | null
          active: boolean
          gro_issued_at: string | null
          gro_valid_until: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']>
        Update: Partial<Database['public']['Tables']['companies']['Row']>
      }
      company_users: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['company_users']['Row']>
        Update: Partial<Database['public']['Tables']['company_users']['Row']>
      }
      assessment_cycles: {
        Row: {
          id: string
          company_id: string
          label: string
          starts_at: string
          ends_at: string
          is_current: boolean
          created_at: string
        }
        Insert: Partial<
          Database['public']['Tables']['assessment_cycles']['Row']
        >
        Update: Partial<
          Database['public']['Tables']['assessment_cycles']['Row']
        >
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          user_type: string | null
          first_name: string | null
          last_name: string | null
          registration_completed_at: string | null
          last_login_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']>
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
    }
  }
}
