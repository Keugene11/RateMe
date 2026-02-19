"use client"

import { useState, useRef, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase-browser"

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkExisting() {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data } = await supabase
          .from("faces")
          .select("image_url")
          .eq("user_id", user.id)
          .single()

        if (data?.image_url) {
          setExistingPhoto(data.image_url)
        }
      } catch {
        // No existing photo
      } finally {
        setLoading(false)
      }
    }
    checkExisting()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB")
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploadSuccess(false)

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("faces")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("faces")
        .getPublicUrl(fileName)

      const res = await fetch("/api/faces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: urlData.publicUrl }),
      })

      if (!res.ok) throw new Error("Failed to create face record")

      setUploadSuccess(true)
      setExistingPhoto(urlData.publicUrl)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const hasExisting = !!existingPhoto

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{hasExisting ? "Your Photo" : "Upload Your Photo"}</CardTitle>
        <CardDescription>
          {hasExisting
            ? "This is your current photo. You can replace it with a new one."
            : "Upload a face photo to be rated by others"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExisting && !preview && (
          <div className="rounded-2xl overflow-hidden">
            <img
              src={existingPhoto}
              alt="Your current photo"
              className="max-h-64 mx-auto rounded-xl"
            />
          </div>
        )}

        <div
          className="border border-dashed border-muted-foreground/20 rounded-2xl p-10 text-center cursor-pointer hover:bg-accent/50 hover:border-muted-foreground/40 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-xl"
            />
          ) : (
            <div className="text-muted-foreground">
              <p className="text-base font-medium text-muted-foreground">
                {hasExisting ? "Tap to select a new photo" : "Tap to select a photo"}
              </p>
              <p className="text-xs mt-2 text-muted-foreground/70">JPG, PNG, WebP up to 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {uploadSuccess && (
          <p className="text-sm text-green-600/80 font-light">
            {hasExisting
              ? "Photo replaced successfully!"
              : "Photo uploaded successfully! It will now appear for others to rate."}
          </p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading
            ? "Uploading..."
            : hasExisting && !file
              ? "Replace Photo"
              : hasExisting
                ? "Replace Photo"
                : "Upload Photo"}
        </Button>
      </CardContent>
    </Card>
  )
}
