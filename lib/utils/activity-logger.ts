import { createClient } from "@/lib/supabase/client"

export async function logActivity(
  userId: string,
  action: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      details: details || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || (typeof window !== "undefined" ? window.navigator.userAgent : null),
    })

    if (error) {
      console.error("Error logging activity:", error)
    }
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

export async function logViolation(
  userId: string,
  messageId: string | null,
  violationType: string,
  description: string,
  severity = 1,
  detectedBy = "system",
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("violations")
      .insert({
        user_id: userId,
        message_id: messageId,
        violation_type: violationType,
        description,
        severity,
        detected_by: detectedBy,
      })
      .select()
      .single()

    if (error) {
      console.error("Error logging violation:", error)
      return null
    }

    // Also log the violation as an activity
    await logActivity(userId, "violation_detected", {
      violation_id: data.id,
      violation_type: violationType,
      severity,
    })

    return data
  } catch (error) {
    console.error("Failed to log violation:", error)
    return null
  }
}
