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
      business_rules: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_closure_log: {
        Row: {
          closed_at: string | null
          date: string
          symbols_count: number | null
        }
        Insert: {
          closed_at?: string | null
          date: string
          symbols_count?: number | null
        }
        Update: {
          closed_at?: string | null
          date?: string
          symbols_count?: number | null
        }
        Relationships: []
      }
      development_history: {
        Row: {
          created_at: string
          date: string
          description: string
          docs_updated: string[] | null
          files_changed: string[] | null
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          docs_updated?: string[] | null
          files_changed?: string[] | null
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          docs_updated?: string[] | null
          files_changed?: string[] | null
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      macro_indicators: {
        Row: {
          created_at: string | null
          date: string
          id: string
          indicator_name: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          indicator_name: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          indicator_name?: string
          value?: number
        }
        Relationships: []
      }
      market_calendar: {
        Row: {
          date: string
          holiday_name: string | null
          is_trading_day: boolean
          notes: string | null
        }
        Insert: {
          date: string
          holiday_name?: string | null
          is_trading_day?: boolean
          notes?: string | null
        }
        Update: {
          date?: string
          holiday_name?: string | null
          is_trading_day?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      market_candles_daily: {
        Row: {
          close: number
          created_at: string | null
          date: string
          high: number
          id: string | null
          low: number
          open: number
          symbol: string
          volume: number | null
        }
        Insert: {
          close: number
          created_at?: string | null
          date: string
          high: number
          id?: string | null
          low: number
          open: number
          symbol: string
          volume?: number | null
        }
        Update: {
          close?: number
          created_at?: string | null
          date?: string
          high?: number
          id?: string | null
          low?: number
          open?: number
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      market_data_logs: {
        Row: {
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          quotes_count: number | null
          success: boolean
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          quotes_count?: number | null
          success: boolean
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          quotes_count?: number | null
          success?: boolean
        }
        Relationships: []
      }
      quotes_latest: {
        Row: {
          change: number | null
          change_percent: number | null
          name: string
          price: number
          symbol: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          change?: number | null
          change_percent?: number | null
          name: string
          price: number
          symbol: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          change?: number | null
          change_percent?: number | null
          name?: string
          price?: number
          symbol?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          archived: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      collect_market_data: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_daily_closure_done: { Args: { p_date: string }; Returns: boolean }
      is_market_open: { Args: never; Returns: boolean }
      process_collected_data: { Args: { p_data: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
