import { NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase-server"

export async function DELETE() {
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

  // Delete user's face and storage file
  const { data: face } = await supabase
    .from("faces")
    .select("id, image_url")
    .eq("user_id", user.id)
    .single()

  if (face) {
    // Delete image from storage
    const path = face.image_url.split("/faces/").pop()
    if (path) {
      await supabase.storage.from("faces").remove([path])
    }

    // Delete face record (ratings cascade-delete automatically)
    await supabase.from("faces").delete().eq("id", face.id)
  }

  // Delete the auth user via admin client
  const admin = createAdminClient()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
