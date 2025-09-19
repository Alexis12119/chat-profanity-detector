"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface Punishment {
  id: string
  punishment_type: string
  duration_minutes: number | null
  reason: string
  expires_at: string | null
  created_at: string
}

interface PunishmentStatusProps {
  userId: string
  onStatusChange?: (canSendMessages: boolean) => void
}

export function PunishmentStatus({ userId, onStatusChange }: PunishmentStatusProps) {
  const [activePunishments, setActivePunishments] = useState<Punishment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadActivePunishments()

    // Set up real-time subscription for punishment updates
    const channel = supabase
      .channel(`punishments-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "punishments",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadActivePunishments()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const loadActivePunishments = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("punishments")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading punishments:", error)
    } else {
      setActivePunishments(data || [])

      // Notify parent component about message sending capability
      const canSendMessages = !data?.some((p) => p.punishment_type === "ban" || p.punishment_type === "mute")
      onStatusChange?.(canSendMessages)
    }
    setIsLoading(false)
  }

  const getPunishmentIcon = (type: string) => {
    switch (type) {
      case "ban":
        return <Shield className="h-4 w-4" />
      case "mute":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPunishmentVariant = (type: string) => {
    switch (type) {
      case "ban":
        return "destructive" as const
      case "mute":
        return "default" as const
      default:
        return "secondary" as const
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)

    if (expiry <= now) {
      return "Expired"
    }

    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`
  }

  if (isLoading) {
    return null
  }

  if (activePunishments.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {activePunishments.map((punishment) => (
        <Alert key={punishment.id} variant={getPunishmentVariant(punishment.punishment_type)}>
          <div className="flex items-start gap-3">
            {getPunishmentIcon(punishment.punishment_type)}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                <span className="capitalize">{punishment.punishment_type}</span>
                <Badge variant="outline" className="text-xs">
                  {punishment.expires_at ? formatTimeRemaining(punishment.expires_at) : "Permanent"}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">{punishment.reason}</p>
                <div className="text-xs text-muted-foreground">
                  Issued {formatDistanceToNow(new Date(punishment.created_at), { addSuffix: true })}
                  {punishment.expires_at && <span> • Expires on {format(new Date(punishment.expires_at), "PPp")}</span>}
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  )
}
