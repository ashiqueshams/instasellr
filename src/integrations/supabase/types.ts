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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          store_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          store_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_settings: {
        Row: {
          access_token: string | null
          client_email: string | null
          client_id: string | null
          client_password: string | null
          client_secret: string | null
          created_at: string
          id: string
          pathao_store_id: number | null
          provider: string
          refresh_token: string | null
          store_id: string
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          client_email?: string | null
          client_id?: string | null
          client_password?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          pathao_store_id?: number | null
          provider?: string
          refresh_token?: string | null
          store_id: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          client_email?: string | null
          client_id?: string | null
          client_password?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          pathao_store_id?: number | null
          provider?: string
          refresh_token?: string | null
          store_id?: string
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_options: {
        Row: {
          cost: number
          created_at: string
          id: string
          is_active: boolean
          label: string
          position: number
          store_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          store_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_options_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          download_count: number | null
          download_expires_at: string | null
          download_token: string | null
          id: string
          order_items: Json | null
          pathao_consignment_id: string | null
          payment_method: string | null
          product_id: string
          recipient_area_id: number | null
          recipient_city_id: number | null
          recipient_zone_id: number | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_state: string | null
          shipping_zip: string | null
          status: string
          store_id: string
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          download_token?: string | null
          id?: string
          order_items?: Json | null
          pathao_consignment_id?: string | null
          payment_method?: string | null
          product_id: string
          recipient_area_id?: number | null
          recipient_city_id?: number | null
          recipient_zone_id?: number | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          status?: string
          store_id: string
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          download_token?: string | null
          id?: string
          order_items?: Json | null
          pathao_consignment_id?: string | null
          payment_method?: string | null
          product_id?: string
          recipient_area_id?: number | null
          recipient_city_id?: number | null
          recipient_zone_id?: number | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          status?: string
          store_id?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_files: {
        Row: {
          created_at: string | null
          file_data: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          product_id: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          file_data: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          product_id: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          file_data?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          product_id?: string
          store_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          emoji: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          product_type: string
          store_id: string
          tagline: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          product_type?: string
          store_id: string
          tagline?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          product_type?: string
          store_id?: string
          tagline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      store_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          position: number
          store_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          store_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          store_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accent_color: string | null
          avatar_initials: string | null
          background_color: string | null
          banner_mode: string | null
          banner_url: string | null
          bio: string | null
          card_style: string | null
          created_at: string
          font_body: string | null
          font_heading: string | null
          footer_image_url: string | null
          id: string
          layout: string | null
          logo_url: string | null
          name: string
          slug: string
          social_links: Json | null
          social_links_color: string | null
          social_position: string | null
          text_color: string | null
          theme: string | null
          user_id: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_initials?: string | null
          background_color?: string | null
          banner_mode?: string | null
          banner_url?: string | null
          bio?: string | null
          card_style?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          footer_image_url?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          name: string
          slug: string
          social_links?: Json | null
          social_links_color?: string | null
          social_position?: string | null
          text_color?: string | null
          theme?: string | null
          user_id?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_initials?: string | null
          background_color?: string | null
          banner_mode?: string | null
          banner_url?: string | null
          bio?: string | null
          card_style?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          footer_image_url?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          social_links?: Json | null
          social_links_color?: string | null
          social_position?: string | null
          text_color?: string | null
          theme?: string | null
          user_id?: string | null
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
