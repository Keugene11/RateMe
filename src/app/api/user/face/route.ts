import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  const { data: face } = await supabase
    .from("faces")
    .select("id, image_url, created_at")
    .eq("user_id", user.id)
    .single()

  if (!face) {
    return NextResponse.json({ face: null, stats: null })
  }

  const { data: stats } = await supabase.rpc("get_face_stats", {
    target_face_id: face.id,
  })

  return NextResponse.json({
    face,
    stats: stats?.[0] ?? { average_rating: 0, total_ratings: 0, distribution: {} },
  })
}
