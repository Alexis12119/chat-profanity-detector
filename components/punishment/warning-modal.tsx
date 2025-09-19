"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Warning {
  id: string
  message: string
  acknowledged: boolean
  acknowledged_at: string | null
  created_at: string
}

interface WarningModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function WarningModal({ userId, isOpen, onClose }: WarningModalProps) {
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && userId) {
      loadWarnings()
    }
  }, [isOpen, userId])

  const loadWarnings = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("warnings")
      .select("*")
      .eq("user_id", userId)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading warnings:", error)
    } else {
      setWarnings(data || [])
    }
    setIsLoading(false)
  }

  const acknowledgeWarning = async (warningId: string) => {
    const { error } = await supabase
      .from("warnings")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", warningId)

    if (error) {
      console.error("Error acknowledging warning:", error)
    } else {
      setWarnings((prev) => prev.filter((w) => w.id !== warningId))
    }
  }

  const acknowledgeAllWarnings = async () => {
    const warningIds = warnings.map((w) => w.id)

    const { error } = await supabase
      .from("warnings")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .in("id", warningIds)

    if (error) {
      console.error("Error acknowledging warnings:", error)
    } else {
      setWarnings([])
      onClose()
    }
  }

  if (!isOpen || warnings.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Community Guidelines Warning
          </DialogTitle>
          <DialogDescription>
            You have {warnings.length} unacknowledged warning{warnings.length > 1 ? "s" : ""} that require your
            attention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {warnings.map((warning) => (
            <div key={warning.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Warning
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm">{warning.message}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => acknowledgeWarning(warning.id)}>
                  Acknowledge
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Please acknowledge these warnings to continue using the chat.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={acknowledgeAllWarnings}>Acknowledge All</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
