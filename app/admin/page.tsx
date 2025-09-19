import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Admin check - User ID:", user.id)
  console.log("[v0] Admin check - Profile:", profile)
  console.log("[v0] Admin check - Error:", error)
  console.log("[v0] Admin check - Is Admin:", profile?.is_admin)

  if (error) {
    console.error("[v0] Error fetching profile:", error)
    redirect("/chat")
  }

  if (!profile?.is_admin) {
    console.log("[v0] User is not admin, redirecting to chat")
    redirect("/chat")
  }

  console.log("[v0] Admin access granted")
  return <AdminDashboard user={user} profile={profile} />
}
