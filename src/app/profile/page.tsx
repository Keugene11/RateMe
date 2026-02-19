import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { ProfileCard } from "@/components/profile-card"

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="flex justify-center pt-8 px-4">
      <ProfileCard user={{ name: user.user_metadata.full_name, avatar: user.user_metadata.avatar_url }} />
    </div>
  )
}
