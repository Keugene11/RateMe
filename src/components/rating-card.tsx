"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Face } from "@/types"

interface RatingCardProps {
  face: Face
  onRate: (score: number) => Promise<void>
  isSubmitting: boolean
}

export function RatingCard({ face, onRate, isSubmitting }: RatingCardProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)

  const handleRate = async (score: number) => {
    setSelectedScore(score)
    await onRate(score)
  }

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-cal-lg">
      <div className="relative aspect-square w-full">
        <Image
          src={face.image_url}
          alt="Face to rate"
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </div>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground mb-5 text-sm font-light tracking-wide">
          Rate this face from 1 to 10
        </p>
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
            <Button
              key={score}
              variant={selectedScore === score ? "default" : "outline"}
              size="lg"
              onClick={() => handleRate(score)}
              disabled={isSubmitting}
              className="text-lg font-bold aspect-square"
            >
              {score}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
