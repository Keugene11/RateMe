import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/faces — returns a random face
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const searchParams = request.nextUrl.searchParams
  const excludeParam = searchParams.get("exclude")
  const excludeIds = excludeParam ? excludeParam.split(",") : []

  const { data, error } = await supabase.rpc("get_random_face", {
    exclude_ids: excludeIds,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ face: data?.[0] ?? null })
}

// POST /api/faces — creates a new face record after image upload
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { image_url } = body

  if (!image_url || typeof image_url !== "string") {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("faces")
    .insert({ image_url })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, face: data })
}
