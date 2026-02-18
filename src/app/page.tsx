"use client"

import { useState, useEffect, useCallback } from "react"
import { RatingCard } from "@/components/rating-card"
import { RatingResult } from "@/components/rating-result"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import type { Face, FaceStats } from "@/types"

type PageState = "loading" | "rating" | "result" | "empty"

export default function HomePage() {
  const [state, setState] = useState<PageState>("loading")
  const [face, setFace] = useState<Face | null>(null)
  const [stats, setStats] = useState<FaceStats | null>(null)
  const [userScore, setUserScore] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seenIds, setSeenIds] = useState<string[]>([])

  const loadRandomFace = useCallback(async (excludeIds: string[] = []) => {
    setState("loading")
    try {
      const exclude = excludeIds.join(",")
      const url = exclude ? `/api/faces?exclude=${exclude}` : "/api/faces"
      const res = await fetch(url)
      const data = await res.json()

      if (data.face) {
        setFace(data.face)
        setState("rating")
      } else {
        setState("empty")
      }
    } catch {
      setState("empty")
    }
  }, [])

  useEffect(() => {
    loadRandomFace()
  }, [loadRandomFace])

  const handleRate = async (score: number) => {
    if (!face || isSubmitting) return
    setIsSubmitting(true)
    setUserScore(score)

    try {
      const res = await fetch(`/api/faces/${face.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
      const data = await res.json()

      if (data.success) {
        setStats(data.stats)
        setSeenIds((prev) => [...prev, face.id])
        setState("result")
      }
    } catch {
      // Allow retry on error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    setStats(null)
    setUserScore(0)
    loadRandomFace(seenIds)
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center pt-8">
        <Card className="w-full max-w-md overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center pt-16 text-center">
        <h2 className="text-2xl font-bold mb-2">No faces to rate</h2>
        <p className="text-muted-foreground mb-4">
          {seenIds.length > 0
            ? "You've rated all available faces! Check back later."
            : "No faces have been uploaded yet. Be the first!"}
        </p>
      </div>
    )
  }

  if (state === "result" && face && stats) {
    return (
      <div className="flex justify-center pt-8">
        <RatingResult
          stats={stats}
          userScore={userScore}
          imageUrl={face.image_url}
          onNext={handleNext}
        />
      </div>
    )
  }

  if (state === "rating" && face) {
    return (
      <div className="flex justify-center pt-8">
        <RatingCard
          face={face}
          onRate={handleRate}
          isSubmitting={isSubmitting}
        />
      </div>
    )
  }

  return null
}
