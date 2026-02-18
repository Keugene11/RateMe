"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          RateMe
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">Rate</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/upload">Upload</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
