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

  const { count } = await supabase
    .from("ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const ratingCount = count ?? 0
  const remaining = REQUIRED_RATINGS - ratingCount
  const progress = Math.min((ratingCount / REQUIRED_RATINGS) * 100, 100)

  if (remaining > 0) {
    return (
      <div className="flex justify-center pt-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold">Upload Locked</h2>
          <p className="text-muted-foreground">
            Rate {remaining} more face{remaining !== 1 ? "s" : ""} to unlock uploads.
          </p>
          <div className="mx-auto w-full max-w-xs">
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {ratingCount} / {REQUIRED_RATINGS} ratings
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start Rating
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center pt-8">
      <UploadForm />
    </div>
  )
}
