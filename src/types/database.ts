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
      faces: {
        Row: {
          id: string
          image_url: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          image_url: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          face_id: string
          score: number
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          face_id: string
          score: number
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          face_id?: string
          score?: number
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_face_id_fkey"
            columns: ["face_id"]
            isOneToOne: false
            referencedRelation: "faces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_random_face: {
        Args: { exclude_ids?: string[] }
        Returns: {
          id: string
          image_url: string
          created_at: string
        }[]
      }
      get_face_stats: {
        Args: { target_face_id: string }
        Returns: {
          average_rating: number
          total_ratings: number
          distribution: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
