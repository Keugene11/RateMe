"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase-browser"
import type { FaceStats } from "@/types"

interface ProfileCardProps {
  user: { name: string; avatar: string }
}

export function ProfileCard({ user }: ProfileCardProps) {
  const router = useRouter()
  const [face, setFace] = useState<{ id: string; image_url: string } | null>(null)
  const [stats, setStats] = useState<FaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFace = async () => {
    try {
      const res = await fetch("/api/user/face")
      if (!res.ok) return
      const data = await res.json()
      setFace(data.face)
      setStats(data.stats)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFace()
  }, [])

  const handleChangePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("faces")
        .upload(fileName, file, { cacheControl: "3600", upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("faces")
        .getPublicUrl(fileName)

      const res = await fetch("/api/faces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: urlData.publicUrl }),
      })

      if (!res.ok) throw new Error("Failed to update photo")

      // Refresh face data
      await fetchFace()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/user", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")

      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )
  }

  const maxCount = stats
    ? Math.max(...Object.values(stats.distribution).map(Number), 1)
    : 1

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      {/* Photo + Score Header */}
      {face ? (
        <div className="relative h-64 w-full">
          <img
            src={face.image_url}
            alt="Your photo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white text-4xl font-extrabold tracking-tight">
                {stats?.average_rating ?? 0}
                <span className="text-xl font-light text-white/70 ml-0.5">/10</span>
              </p>
              <p className="text-white/60 text-xs font-light tracking-wide">
                {stats?.total_ratings ?? 0} rating
                {stats?.total_ratings !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <CardHeader className="text-center pb-2">
          <CardTitle>No Photo Yet</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a photo to start getting rated
          </p>
        </CardHeader>
      )}

      <CardContent className="p-6 space-y-6">
        {/* Rating Distribution */}
        {face && stats && stats.total_ratings > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
              Rating Distribution
            </p>
            <div className="space-y-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                const count = stats.distribution[String(score)] ?? 0
                const percentage = maxCount > 0 ? (Number(count) / maxCount) * 100 : 0
                return (
                  <div key={score} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right text-muted-foreground">
                      {score}
                    </span>
                    <Progress value={percentage} className="flex-1 h-1.5" />
                    <span className="w-8 text-right text-muted-foreground">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {face ? (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </Button>
          ) : (
            <Button asChild className="w-full" size="lg">
              <Link href="/upload">Upload Photo</Link>
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChangePhoto}
            className="hidden"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {showConfirm ? (
            <div className="space-y-2 p-4 border border-destructive/20 rounded-xl bg-destructive/5">
              <p className="text-sm font-medium">Are you sure? This will permanently delete your account, photo, and all ratings.</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(true)}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Delete Account
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
