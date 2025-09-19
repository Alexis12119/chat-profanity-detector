"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "./chat-sidebar"
import { ChatWindow } from "./chat-window"
import { UserProfile } from "./user-profile"
import { WarningModal } from "@/components/punishment/warning-modal"
import { PunishmentStatus } from "@/components/punishment/punishment-status"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { logActivity } from "@/lib/utils/activity-logger"

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

interface ChatLayoutProps {
  user: User
  profile: Profile | null
  initialRooms: ChatRoom[]
}

export function ChatLayout({ user, profile, initialRooms }: ChatLayoutProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialRooms.length > 0 ? initialRooms[0].id : null,
  )
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showWarnings, setShowWarnings] = useState(false)
  const [canSendMessages, setCanSendMessages] = useState(true)
  const supabase = createClient()

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)

  useEffect(() => {
    const logLoginActivity = async () => {
      await logActivity(user.id, "login", {
        timestamp: new Date().toISOString(),
      })
    }

    logLoginActivity()

    // Check for unacknowledged warnings
    checkForWarnings()
  }, [user.id])

  const checkForWarnings = async () => {
    const { data: warnings } = await supabase
      .from("warnings")
      .select("id")
      .eq("user_id", user.id)
      .eq("acknowledged", false)

    if (warnings && warnings.length > 0) {
      setShowWarnings(true)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel("chat-rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRooms((prev) => [...prev, payload.new as ChatRoom])
          } else if (payload.eventType === "UPDATE") {
            setRooms((prev) => prev.map((room) => (room.id === payload.new.id ? { ...room, ...payload.new } : room)))
          } else if (payload.eventType === "DELETE") {
            setRooms((prev) => prev.filter((room) => room.id !== payload.old.id))
            if (selectedRoomId === payload.old.id) {
              setSelectedRoomId(rooms.length > 1 ? rooms[0].id : null)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, selectedRoomId, rooms])

  const handleSignOut = async () => {
    await logActivity(user.id, "logout", {
      timestamp: new Date().toISOString(),
    })

    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Check if user is banned
  if (profile?.is_banned) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Account Suspended</h1>
          <p className="text-muted-foreground mb-6">
            Your account has been suspended due to violations of our community guidelines.
          </p>
          <PunishmentStatus userId={user.id} />
          <div className="mt-6">
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Warning Modal */}
      <WarningModal userId={user.id} isOpen={showWarnings} onClose={() => setShowWarnings(false)} />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:w-80 lg:max-w-none
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border flex-shrink-0">
            <h1 className="text-lg font-semibold text-sidebar-foreground truncate">ChatApp</h1>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden flex-shrink-0"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Punishment Status */}
          <div className="p-4 flex-shrink-0">
            <PunishmentStatus userId={user.id} onStatusChange={setCanSendMessages} />
          </div>

          {/* Chat Rooms */}
          <div className="flex-1 min-h-0">
            <ChatSidebar rooms={rooms} selectedRoomId={selectedRoomId} onRoomSelect={setSelectedRoomId} />
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0">
            <UserProfile user={user} profile={profile} onSignOut={handleSignOut} />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)} className="flex-shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold truncate mx-2">{selectedRoom?.name || "Select a room"}</h2>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop header with logout button */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">{selectedRoom?.name || "Select a room"}</h2>
            {selectedRoom?.description && (
              <p className="text-sm text-muted-foreground truncate">{selectedRoom.description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-shrink-0 ml-4">
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden xl:inline">Sign Out</span>
          </Button>
        </div>

        {/* Chat Window */}
        {selectedRoom ? (
          <div className="flex-1 min-h-0">
            <ChatWindow room={selectedRoom} user={user} profile={profile} canSendMessages={canSendMessages} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to ChatApp</h2>
              <p className="text-muted-foreground">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
