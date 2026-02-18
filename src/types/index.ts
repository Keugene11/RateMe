export interface Face {
  id: string
  image_url: string
  user_id: string | null
  created_at: string
}

export interface Rating {
  id: string
  face_id: string
  score: number
  created_at: string
}

export interface FaceStats {
  average_rating: number
  total_ratings: number
  distribution: Record<string, number>
}

export interface RandomFaceResponse {
  face: Face | null
}

export interface RateResponse {
  success: boolean
  stats: FaceStats
}

export interface UploadResponse {
  success: boolean
  face: Face
}
