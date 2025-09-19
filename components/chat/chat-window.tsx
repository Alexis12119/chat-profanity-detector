"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { TypingIndicator } from "./typing-indicator"
import { ViolationAlert } from "./violation-alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logActivity } from "@/lib/utils/activity-logger"
import { validateMessage, processViolation } from "@/lib/utils/message-validator"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_banned: boolean
}

interface ChatRoom {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_at: string
}

interface Message {
  id: string
  content: string
  user_id: string
  room_id: string
  is_deleted: boolean
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
    is_admin: boolean
  }
}

interface ChatWindowProps {
  room: ChatRoom
  user: User
  profile: Profile | null
  canSendMessages?: boolean
}

interface ViolationWarning {
  violations: Array<{
    type: string
    description: string
    severity: number
  }>
  shouldBlock: boolean
  shouldWarn: boolean
}

export function ChatWindow({ room, user, profile, canSendMessages = true }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [violationWarning, setViolationWarning] = useState<ViolationWarning | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const memoizedMessages = useMemo(() => messages, [messages])

  const loadMessages = useCallback(
    async (offset = 0, limit = 50) => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url,
          is_admin
        )
      `)
        .eq("room_id", room.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("Error loading messages:", error)
        return []
      }

      return (data || []).reverse() // Reverse to show oldest first
    },
    [room.id, supabase],
  )

  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true)
      const initialMessages = await loadMessages(0, 50)
      setMessages(initialMessages)
      setHasMoreMessages(initialMessages.length === 50)
      setIsLoading(false)
    }

    loadInitialMessages()
  }, [room.id, loadMessages])

  useEffect(() => {
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("messages")
            .select(`
              *,
              profiles (
                username,
                display_name,
                avatar_url,
                is_admin
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (newMessage && !newMessage.is_deleted) {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev
              }
              const updatedMessages = [...prev, newMessage]
              if (updatedMessages.length > 200) {
                return updatedMessages.slice(-200)
              }
              return updatedMessages
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev
              .map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
              .filter((msg) => !msg.is_deleted),
          )
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase])

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [memoizedMessages, scrollToBottom])

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return

    setIsLoadingMore(true)
    const moreMessages = await loadMessages(messages.length, 50)

    if (moreMessages.length > 0) {
      setMessages((prev) => [...moreMessages, ...prev])
      setHasMoreMessages(moreMessages.length === 50)
    } else {
      setHasMoreMessages(false)
    }

    setIsLoadingMore(false)
  }, [isLoadingMore, hasMoreMessages, messages.length, loadMessages])

  const handleSendMessage = async (content: string) => {
    if (!profile || profile.is_banned || !canSendMessages) return

    console.log("[v0] Validating message:", content)
    const validation = await validateMessage(content, user.id, room.id)
    console.log("[v0] Validation result:", validation)

    if (!validation.isValid) {
      if (validation.shouldBlock) {
        console.log("[v0] Message blocked due to violations")
        setViolationWarning({
          violations: validation.violations,
          shouldBlock: true,
          shouldWarn: false,
        })

        await processViolation(user.id, validation.violations)
        return
      } else if (validation.shouldWarn) {
        console.log("[v0] Message warning triggered")
        setViolationWarning({
          violations: validation.violations,
          shouldBlock: false,
          shouldWarn: true,
        })

        setTimeout(() => setViolationWarning(null), 5000)
      }
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content,
        user_id: user.id,
        room_id: room.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
    } else {
      await logActivity(user.id, "message_sent", {
        room_id: room.id,
        room_name: room.name,
        message_length: content.length,
        has_violations: !validation.isValid,
      })

      if (!validation.isValid && data) {
        await processViolation(user.id, validation.violations, data.id)
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {violationWarning && (
        <div className="flex-shrink-0">
          <ViolationAlert
            violations={violationWarning.violations}
            isBlocked={violationWarning.shouldBlock}
            onDismiss={() => setViolationWarning(null)}
          />
        </div>
      )}

      <div className="flex items-center justify-end p-2 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <MessageList
              messages={memoizedMessages}
              currentUserId={user.id}
              isLoading={isLoading}
              hasMoreMessages={hasMoreMessages}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreMessages}
            />
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0">
        <TypingIndicator roomId={room.id} currentUserId={user.id} />
      </div>

      <div className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={profile?.is_banned || !canSendMessages}
          placeholder={
            profile?.is_banned
              ? "You are banned from sending messages"
              : !canSendMessages
                ? "You are currently muted"
                : `Message ${room.name}`
          }
          roomId={room.id}
          userId={user.id}
        />
      </div>
    </div>
  )
}
