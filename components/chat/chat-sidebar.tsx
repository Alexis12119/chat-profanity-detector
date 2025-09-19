"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Lock } from "lucide-react"

interface ChatRoom {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_at: string
}

interface ChatSidebarProps {
  rooms: ChatRoom[]
  selectedRoomId: string | null
  onRoomSelect: (roomId: string) => void
}

export function ChatSidebar({ rooms, selectedRoomId, onRoomSelect }: ChatSidebarProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="p-4">
        <h2 className="text-sm font-medium text-sidebar-foreground mb-3">Rooms</h2>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoomId === room.id ? "secondary" : "ghost"}
              className={`
                w-full justify-start text-left h-auto p-3 font-normal
                ${
                  selectedRoomId === room.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }
              `}
              onClick={() => onRoomSelect(room.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  {room.is_private ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{room.name}</div>
                  {room.description && (
                    <div className="text-xs text-muted-foreground truncate mt-1">{room.description}</div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
