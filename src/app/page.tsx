"use client"

import { useState, useEffect, useCallback } from "react"
import { RatingCard } from "@/components/rating-card"
import { RatingResult } from "@/components/rating-result"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase-browser"
import type { Face, FaceStats } from "@/types"
import type { User } from "@supabase/supabase-js"

const REQUIRED_RATINGS = 50

type PageState = "loading" | "rating" | "result" | "empty" | "signed-out"

export default function HomePage() {
  const [state, setState] = useState<PageState>("loading")
  const [user, setUser] = useState<User | null>(null)
  const [face, setFace] = useState<Face | null>(null)
  const [stats, setStats] = useState<FaceStats | null>(null)
  const [userScore, setUserScore] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [ratingCount, setRatingCount] = useState<number>(0)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) setState("signed-out")
    }).catch(() => {
      setState("signed-out")
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setState("signed-out")
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRatingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/user/rating-count")
      if (res.ok) {
        const data = await res.json()
        setRatingCount(data.count)
      }
    } catch {
      // ignore
    }
  }, [])

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
    if (user) {
      fetchRatingCount()
      loadRandomFace()
    }
  }, [user, fetchRatingCount, loadRandomFace])

  const handleSignIn = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

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
        setRatingCount((prev) => prev + 1)
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

  if (state === "signed-out") {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Rate Faces</h2>
        <p className="text-muted-foreground mb-8 text-base font-light max-w-xs leading-relaxed">
          Sign in to start rating faces and unlock uploads.
        </p>
        <Button onClick={handleSignIn} size="lg" className="px-8">Sign in with Google</Button>
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center pt-8">
        <Card className="w-full max-w-md overflow-hidden shadow-cal-lg">
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
      <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
        <h2 className="text-2xl font-bold tracking-tight mb-3">No faces to rate</h2>
        <p className="text-muted-foreground mb-4 font-light leading-relaxed">
          {seenIds.length > 0
            ? "You've rated all available faces! Check back later."
            : "No faces have been uploaded yet. Be the first!"}
        </p>
      </div>
    )
  }

  const progress = Math.min((ratingCount / REQUIRED_RATINGS) * 100, 100)
  const showProgress = ratingCount < REQUIRED_RATINGS

  if (state === "result" && face && stats) {
    return (
      <div className="flex flex-col items-center pt-8 gap-4">
        {showProgress && (
          <div className="w-full max-w-md">
            <div className="h-1.5 w-full rounded-full bg-muted/60">
              <div
                className="h-1.5 rounded-full bg-primary/80 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground/80 text-center font-light">
              {ratingCount} / {REQUIRED_RATINGS} ratings to unlock uploads
            </p>
          </div>
        )}
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
      <div className="flex flex-col items-center pt-8 gap-4">
        {showProgress && (
          <div className="w-full max-w-md">
            <div className="h-1.5 w-full rounded-full bg-muted/60">
              <div
                className="h-1.5 rounded-full bg-primary/80 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground/80 text-center font-light">
              {ratingCount} / {REQUIRED_RATINGS} ratings to unlock uploads
            </p>
          </div>
        )}
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
