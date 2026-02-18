import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// POST /api/faces/[id]/rate — submit a rating and return updated stats
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: faceId } = await params
  const body = await request.json()
  const { score } = body

  if (
    typeof score !== "number" ||
    score < 1 ||
    score > 10 ||
    !Number.isInteger(score)
  ) {
    return NextResponse.json(
      { error: "Score must be an integer between 1 and 10" },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()

  // Verify face exists
  const { data: face, error: faceError } = await supabase
    .from("faces")
    .select("id")
    .eq("id", faceId)
    .single()

  if (faceError || !face) {
    return NextResponse.json({ error: "Face not found" }, { status: 404 })
  }

  // Optionally capture user_id (anonymous rating is fine)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Insert rating
  const { error: ratingError } = await supabase
    .from("ratings")
    .insert({
      face_id: faceId,
      score,
      ...(user ? { user_id: user.id } : {}),
    })

  if (ratingError) {
    console.error("Rating insert error:", ratingError)
    return NextResponse.json({ error: ratingError.message }, { status: 500 })
  }

  // Fetch updated stats
  const { data: stats, error: statsError } = await supabase.rpc(
    "get_face_stats",
    { target_face_id: faceId }
  )

  if (statsError) {
    console.error("Stats fetch error:", statsError)
    return NextResponse.json({ error: statsError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    stats: stats?.[0] ?? {
      average_rating: 0,
      total_ratings: 0,
      distribution: {},
    },
  })
}
