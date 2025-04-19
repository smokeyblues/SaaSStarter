export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contact_requests: {
        Row: {
          company_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          message_body: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          email: string | null
          full_name: string | null
          id: string
          unsubscribed: boolean
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          unsubscribed?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          unsubscribed?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_assets: {
        Row: {
          asset_category:
            | Database["public"]["Enums"]["asset_category_enum"]
            | null
          created_at: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          project_id: string
          size_bytes: number | null
          updated_at: string | null
          uploaded_by_user_id: string | null
        }
        Insert: {
          asset_category?:
            | Database["public"]["Enums"]["asset_category_enum"]
            | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          project_id: string
          size_bytes?: number | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Update: {
          asset_category?:
            | Database["public"]["Enums"]["asset_category_enum"]
            | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          project_id?: string
          size_bytes?: number | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_business_details: {
        Row: {
          business_models: string | null
          created_at: string | null
          goals_creative: string | null
          goals_economic: string | null
          goals_user: string | null
          id: string
          project_id: string
          success_indicators: string | null
          target_audience: string | null
          updated_at: string | null
          user_need: string | null
        }
        Insert: {
          business_models?: string | null
          created_at?: string | null
          goals_creative?: string | null
          goals_economic?: string | null
          goals_user?: string | null
          id?: string
          project_id: string
          success_indicators?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_need?: string | null
        }
        Update: {
          business_models?: string | null
          created_at?: string | null
          goals_creative?: string | null
          goals_economic?: string | null
          goals_user?: string | null
          id?: string
          project_id?: string
          success_indicators?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_need?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_business_details_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_design_specs: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_design_specs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_feedback_log: {
        Row: {
          feedback_received: string
          id: string
          logged_at: string | null
          logged_by_user_id: string | null
          platform_source: string
          project_id: string
          shared_item_description: string
        }
        Insert: {
          feedback_received: string
          id?: string
          logged_at?: string | null
          logged_by_user_id?: string | null
          platform_source: string
          project_id: string
          shared_item_description: string
        }
        Update: {
          feedback_received?: string
          id?: string
          logged_at?: string | null
          logged_by_user_id?: string | null
          platform_source?: string
          project_id?: string
          shared_item_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_functional_specs: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_functional_specs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_plot_points: {
        Row: {
          created_at: string | null
          description: string
          id: string
          order_index: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          order_index?: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          order_index?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_plot_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tech_specs: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tech_specs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_treatments: {
        Row: {
          backstory_context: string | null
          characterization_attitude: string | null
          created_at: string | null
          id: string
          project_id: string
          synopsis: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          backstory_context?: string | null
          characterization_attitude?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          synopsis?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          backstory_context?: string | null
          characterization_attitude?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          synopsis?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_treatments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_user_scenarios: {
        Row: {
          created_at: string | null
          description: string
          id: string
          order_index: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          order_index?: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          order_index?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_user_scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_team_id_fkey"
            columns: ["owner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by_user_id: string
          invited_user_email: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by_user_id: string
          invited_user_email: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string
          invited_user_email?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string; accepting_user_id: string }
        Returns: {
          success: boolean
          message: string
          team_id: string
        }[]
      }
      get_invitation_details_by_token: {
        Args: { p_token: string }
        Returns: {
          invite_id: string
          team_id: string
          invited_user_email: string
          invite_role: Database["public"]["Enums"]["team_role"]
          invite_status: string
          team_name: string
        }[]
      }
      get_project_details_for_member: {
        Args: { input_project_id: string }
        Returns: {
          project_id: string
          project_name: string
          team_id: string
          team_name: string
        }[]
      }
      get_team_details_for_member: {
        Args: { input_team_id: string }
        Returns: {
          id: string
          name: string
          owner_user_id: string
        }[]
      }
      get_user_teams_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
          team_id: string
          team_name: string
          team_owner_user_id: string
        }[]
      }
      is_project_member: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      asset_category_enum:
        | "script"
        | "concept_art"
        | "moodboard"
        | "storyboard"
        | "wireframe"
        | "style_guide"
        | "audio"
        | "video"
        | "image"
        | "document"
        | "other"
      team_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_category_enum: [
        "script",
        "concept_art",
        "moodboard",
        "storyboard",
        "wireframe",
        "style_guide",
        "audio",
        "video",
        "image",
        "document",
        "other",
      ],
      team_role: ["owner", "admin", "member"],
    },
  },
} as const
