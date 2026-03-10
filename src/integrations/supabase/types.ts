export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      artworks: {
        Row: {
          apiframe_task_id: string | null
          art_style: string
          artwork_analysis: Json | null
          artwork_url: string | null
          birth_data: Json
          chart_data: Json
          created_at: string
          customer_name: string | null
          id: string
          is_portrait_edition: boolean
          order_number: string | null
          original_cdn_url: string | null
          prompt_used: string | null
          session_id: string | null
          shopify_checkout_url: string | null
          shopify_order_id: string | null
          status: string | null
          upscale_status: string | null
          upscaled_url: string | null
        }
        Insert: {
          apiframe_task_id?: string | null
          art_style?: string
          artwork_analysis?: Json | null
          artwork_url?: string | null
          birth_data?: Json
          chart_data?: Json
          created_at?: string
          customer_name?: string | null
          id?: string
          is_portrait_edition?: boolean
          order_number?: string | null
          original_cdn_url?: string | null
          prompt_used?: string | null
          session_id?: string | null
          shopify_checkout_url?: string | null
          shopify_order_id?: string | null
          status?: string | null
          upscale_status?: string | null
          upscaled_url?: string | null
        }
        Update: {
          apiframe_task_id?: string | null
          art_style?: string
          artwork_analysis?: Json | null
          artwork_url?: string | null
          birth_data?: Json
          chart_data?: Json
          created_at?: string
          customer_name?: string | null
          id?: string
          is_portrait_edition?: boolean
          order_number?: string | null
          original_cdn_url?: string | null
          prompt_used?: string | null
          session_id?: string | null
          shopify_checkout_url?: string | null
          shopify_order_id?: string | null
          status?: string | null
          upscale_status?: string | null
          upscaled_url?: string | null
        }
        Relationships: []
      }
      email_captures: {
        Row: {
          artwork_expiry_date: string | null
          artwork_id: string | null
          artwork_url: string | null
          capture_timestamp: string | null
          converted: boolean | null
          converted_at: string | null
          cosmic10_expiry: string | null
          created_at: string
          dominant_element: string | null
          element_balance: Json | null
          email: string
          email_mockup_url: string | null
          first_name: string | null
          id: string
          moon_sign: string | null
          nurture_branch: string | null
          peak_season: string | null
          rising_sign: string | null
          session_id: string | null
          status: string | null
          sun_sign: string | null
          updated_at: string
        }
        Insert: {
          artwork_expiry_date?: string | null
          artwork_id?: string | null
          artwork_url?: string | null
          capture_timestamp?: string | null
          converted?: boolean | null
          converted_at?: string | null
          cosmic10_expiry?: string | null
          created_at?: string
          dominant_element?: string | null
          element_balance?: Json | null
          email: string
          email_mockup_url?: string | null
          first_name?: string | null
          id?: string
          moon_sign?: string | null
          nurture_branch?: string | null
          peak_season?: string | null
          rising_sign?: string | null
          session_id?: string | null
          status?: string | null
          sun_sign?: string | null
          updated_at?: string
        }
        Update: {
          artwork_expiry_date?: string | null
          artwork_id?: string | null
          artwork_url?: string | null
          capture_timestamp?: string | null
          converted?: boolean | null
          converted_at?: string | null
          cosmic10_expiry?: string | null
          created_at?: string
          dominant_element?: string | null
          element_balance?: Json | null
          email?: string
          email_mockup_url?: string | null
          first_name?: string | null
          id?: string
          moon_sign?: string | null
          nurture_branch?: string | null
          peak_season?: string | null
          rising_sign?: string | null
          session_id?: string | null
          status?: string | null
          sun_sign?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          artwork_analysis: Json | null
          chart_data: Json
          created_at: string
          customer_email: string
          generated_image_url: string
          id: string
          insert_card_url: string | null
          shopify_order_id: string | null
          shopify_order_number: string | null
          subject_explanation: string | null
        }
        Insert: {
          artwork_analysis?: Json | null
          chart_data?: Json
          created_at?: string
          customer_email: string
          generated_image_url: string
          id?: string
          insert_card_url?: string | null
          shopify_order_id?: string | null
          shopify_order_number?: string | null
          subject_explanation?: string | null
        }
        Update: {
          artwork_analysis?: Json | null
          chart_data?: Json
          created_at?: string
          customer_email?: string
          generated_image_url?: string
          id?: string
          insert_card_url?: string | null
          shopify_order_id?: string | null
          shopify_order_number?: string | null
          subject_explanation?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
