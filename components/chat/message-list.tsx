"use client"

import { memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

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

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLoading: boolean
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

const MessageItem = memo(({ message, currentUserId }: { message: Message; currentUserId: string }) => {
  const isOwnMessage = message.user_id === currentUserId
  const displayName = message.profiles.display_name || message.profiles.username
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  return (
    <div className={`flex gap-2 sm:gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 mt-1">
        <AvatarImage src={message.profiles.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
          <span className={`text-xs sm:text-sm font-medium ${isOwnMessage ? "order-2" : "order-1"}`}>
            {isOwnMessage ? "You" : displayName}
          </span>
          {message.profiles.is_admin && (
            <Badge variant="secondary" className={`text-xs ${isOwnMessage ? "order-1" : "order-2"}`}>
              Admin
            </Badge>
          )}
          <span className={`text-xs text-muted-foreground ${isOwnMessage ? "order-0" : "order-3"}`}>{timeAgo}</span>
        </div>

        <div
          className={`
            rounded-lg px-2 sm:px-3 py-2 text-sm max-w-full break-words hyphens-auto
            ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card border border-border"}
          `}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
})

MessageItem.displayName = "MessageItem"

export const MessageList = memo(function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMoreMessages = false,
  isLoadingMore = false,
  onLoadMore,
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to say something!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {hasMoreMessages && onLoadMore && (
        <div className="flex justify-center py-2">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load older messages"}
          </Button>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentUserId={currentUserId} />
      ))}
    </div>
  )
})
