import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { UploadForm } from "@/components/upload-form"

export default async function UploadPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="flex justify-center pt-8">
      <UploadForm />
    </div>
  )
}
