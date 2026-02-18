import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase-server"
import { UploadForm } from "@/components/upload-form"

const REQUIRED_RATINGS = 50

export default async function UploadPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // TODO: Re-enable 50-rating gate after seeding

  return (
    <div className="flex justify-center pt-8">
      <UploadForm />
    </div>
  )
}
