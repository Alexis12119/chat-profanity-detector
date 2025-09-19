"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
  roomId?: string
  userId?: string
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  roomId,
  userId,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  const handleTypingStart = () => {
    if (!isTyping && roomId && userId) {
      setIsTyping(true)
      supabase.channel(`typing-${roomId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: userId, is_typing: true },
      })
    }
  }

  const handleTypingStop = () => {
    if (isTyping && roomId && userId) {
      setIsTyping(false)
      supabase.channel(`typing-${roomId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: userId, is_typing: false },
      })
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      handleTypingStop()
    }
  }, [])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage("")
      handleTypingStop()
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    handleTypingStart()

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop()
    }, 2000)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[40px] max-h-[120px] resize-none bg-input"
          rows={1}
        />
      </div>
      <Button onClick={handleSend} disabled={disabled || !message.trim()} size="sm" className="h-10 w-10 p-0">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
