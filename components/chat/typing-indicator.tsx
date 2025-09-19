"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface TypingIndicatorProps {
  roomId: string
  currentUserId: string
}

export function TypingIndicator({ roomId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`typing-${roomId}`)

    // Listen for typing events
    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { user_id, is_typing } = payload.payload

        if (user_id !== currentUserId) {
          setTypingUsers((prev) => {
            if (is_typing) {
              return prev.includes(user_id) ? prev : [...prev, user_id]
            } else {
              return prev.filter((id) => id !== user_id)
            }
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, currentUserId, supabase])

  if (typingUsers.length === 0) return null

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      {typingUsers.length === 1 ? (
        <span>Someone is typing...</span>
      ) : (
        <span>{typingUsers.length} people are typing...</span>
      )}
    </div>
  )
}
