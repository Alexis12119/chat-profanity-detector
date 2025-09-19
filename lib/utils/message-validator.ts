import {
  detectViolations,
  detectRepeatedMessages,
  detectRapidPosting,
} from "./violation-detector";
import { createClient } from "@/lib/supabase/client";

interface ValidationResult {
  isValid: boolean;
  violations: Array<{
    type: string;
    description: string;
    severity: number;
  }>;
  shouldBlock: boolean;
  shouldWarn: boolean;
}

export async function validateMessage(
  content: string,
  userId: string,
  roomId: string,
): Promise<ValidationResult> {
  const supabase = createClient();

  // Get recent messages from this user for pattern detection
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, created_at")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .gte("created_at", new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
    .order("created_at", { ascending: false })
    .limit(10);

  const recentContent = recentMessages?.map((msg) => msg.content) || [];
  const recentTimestamps =
    recentMessages?.map((msg) => new Date(msg.created_at)) || [];

  // Run all violation checks
  const violations = await detectViolations(content, userId);

  // Check for repeated messages
  const repeatedViolation = detectRepeatedMessages(content, recentContent);
  if (repeatedViolation.hasViolation) {
    violations.push(repeatedViolation);
  }

  // Check for rapid posting
  const rapidPostingViolation = detectRapidPosting(recentTimestamps);
  if (rapidPostingViolation.hasViolation) {
    violations.push(rapidPostingViolation);
  }

  // Determine action based on violations
  const maxSeverity = Math.max(...violations.map((v) => v.severity || 0), 0);
  const shouldBlock = maxSeverity >= 1 || violations.length >= 3;
  const shouldWarn = maxSeverity >= 2 && !shouldBlock;

  return {
    isValid: violations.length === 0,
    violations: violations.map((v) => ({
      type: v.violationType || "unknown",
      description: v.description || "Violation detected",
      severity: v.severity || 1,
    })),
    shouldBlock,
    shouldWarn,
  };
}

export async function processViolation(
  userId: string,
  violations: Array<{ type: string; description: string; severity: number }>,
  messageId?: string,
) {
  const supabase = createClient();

  // 🔹 Insert violations into DB
  const { data: insertedViolations, error: insertError } = await supabase
    .from("violations")
    .insert(
      violations.map((v) => ({
        user_id: userId,
        violation_type: v.type,
        description: v.description,
        severity: v.severity,
        detected_by: "system",
        message_id: messageId ?? null,
      })),
    )
    .select("*");

  if (insertError) {
    console.error("Failed to insert violations:", insertError);
    return {
      punishmentType: null,
      duration: null,
      totalSeverity: 0,
      recentViolations: 0,
    };
  }

  // Now you can fetch history (including the just-inserted ones)
  const { data: violationHistory } = await supabase
    .from("violations")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .order("created_at", { ascending: false });

  const recentViolations = violationHistory?.length || 0;
  const totalSeverity = violations.reduce((sum, v) => sum + v.severity, 0);

  let punishmentType: string | null = null;
  let duration: number | null = null;

  if (recentViolations >= 5 || totalSeverity >= 10) {
    punishmentType = "ban";
    duration = 1440;
  } else if (recentViolations >= 3 || totalSeverity >= 6) {
    punishmentType = "mute";
    duration = 60;
  } else if (totalSeverity >= 3) {
    punishmentType = "warning";
  }

  if (punishmentType) {
    const expiresAt = duration
      ? new Date(Date.now() + duration * 60000).toISOString()
      : null;

    if (punishmentType === "warning") {
      await supabase.from("warnings").insert({
        user_id: userId,
        message: `You have violated community guidelines: ${violations.map((v) => v.description).join(", ")}`,
        issued_by: null,
      });
    } else {
      await supabase.from("punishments").insert({
        user_id: userId,
        violation_id: insertedViolations?.[0]?.id ?? null, // 🔹 link first violation
        punishment_type: punishmentType,
        duration_minutes: duration,
        reason: `Automated punishment for violations: ${violations.map((v) => v.description).join(", ")}`,
        issued_by: null,
        expires_at: expiresAt,
      });

      if (punishmentType === "ban") {
        await supabase
          .from("profiles")
          .update({ is_banned: true })
          .eq("id", userId);
      }
    }
  }

  return { punishmentType, duration, totalSeverity, recentViolations };
}
