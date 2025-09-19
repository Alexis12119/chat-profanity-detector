import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatLayout } from "@/components/chat/chat-layout"

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get chat rooms
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("is_private", false)
    .order("created_at", { ascending: true })

  return <ChatLayout user={user} profile={profile} initialRooms={rooms || []} />
}
