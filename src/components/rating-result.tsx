"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { FaceStats } from "@/types"

interface RatingResultProps {
  stats: FaceStats
  userScore: number
  imageUrl: string
  onNext: () => void
}

export function RatingResult({
  stats,
  userScore,
  imageUrl,
  onNext,
}: RatingResultProps) {
  const maxCount = Math.max(...Object.values(stats.distribution), 1)

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-cal-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative h-56 w-full">
        <img
          src={imageUrl}
          alt="Rated face"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <p className="text-white text-5xl font-bold tracking-tight">
              {stats.average_rating}
              <span className="text-xl font-light text-white/70 ml-0.5">/10</span>
            </p>
            <p className="text-white/60 text-xs font-light tracking-wide">
              {stats.total_ratings} rating
              {stats.total_ratings !== 1 ? "s" : ""}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm bg-white/20 text-white border-0 backdrop-blur-sm">
            You rated: {userScore}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Rating Distribution
          </CardTitle>
        </CardHeader>

        <div className="space-y-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
            const count = stats.distribution[String(score)] ?? 0
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
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

        <Button onClick={onNext} className="w-full mt-8" size="lg">
          Next Face
        </Button>
      </CardContent>
    </Card>
  )
}
