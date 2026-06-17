"use client"

import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: Date
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, isClient])

  if (!isClient) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums text-primary">--</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Dias</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums text-primary">--</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Hrs</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums text-primary">--</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Min</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums text-primary">--</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Seg</span>
        </div>
      </div>
    )
  }

  if (!timeLeft) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold animate-pulse">
          En curso
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex flex-col items-center min-w-[32px]">
        <span className="text-lg font-bold tabular-nums text-primary leading-none">
          {String(timeLeft.days).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Dias</span>
      </div>
      <span className="text-muted-foreground/50 font-bold self-start mt-0.5">:</span>
      <div className="flex flex-col items-center min-w-[32px]">
        <span className="text-lg font-bold tabular-nums text-primary leading-none">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Hrs</span>
      </div>
      <span className="text-muted-foreground/50 font-bold self-start mt-0.5">:</span>
      <div className="flex flex-col items-center min-w-[32px]">
        <span className="text-lg font-bold tabular-nums text-primary leading-none">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Min</span>
      </div>
      <span className="text-muted-foreground/50 font-bold self-start mt-0.5">:</span>
      <div className="flex flex-col items-center min-w-[32px]">
        <span className="text-lg font-bold tabular-nums text-primary leading-none">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Seg</span>
      </div>
    </div>
  )
}
