"use client"

import { useState, useRef } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase"

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Your Photo</CardTitle>
        <CardDescription>
          Upload a face photo to be rated by others
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded"
            />
          ) : (
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">Click to select an image</p>
              <p className="text-sm mt-1">JPG, PNG, WebP up to 5MB</p>
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
          <p className="text-sm text-green-600">
            Photo uploaded successfully! It will now appear for others to rate.
          </p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </CardContent>
    </Card>
  )
}
