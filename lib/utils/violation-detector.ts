import { logViolation } from "./activity-logger";

interface ViolationResult {
  hasViolation: boolean;
  violationType?: string;
  description?: string;
  severity?: number;
  confidence?: number;
}

// Predefined lists of inappropriate content
const PROFANITY_WORDS = [
  "damn",
  "hell",
  "crap",
  "stupid",
  "idiot",
  "moron",
  "dumb",
  "loser",
  "bobo",
  "bobo ka",
  "8080",
  "Tanginamo",
  "Putanginamo",
  "3030",
  "Tanga",
  "Panget",
  "Mongoloid",
  "9090",
  // Add more words as needed - this is a basic example
];

const HARASSMENT_PATTERNS = [
  /kill\s+yourself/i,
  /go\s+die/i,
  /you\s+suck/i,
  /hate\s+you/i,
  /shut\s+up/i,
  /get\s+lost/i,
];

const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (aaaaa)
  /^[A-Z\s!]{10,}$/g, // All caps messages
  /https?:\/\/[^\s]+/g, // URLs (basic spam detection)
];

export async function detectViolations(
  content: string,
  userId: string,
  messageId?: string,
): Promise<ViolationResult[]> {
  const violations: ViolationResult[] = [];
  const lowerContent = content.toLowerCase();

  // 1. Profanity Detection
  const profanityViolation = detectProfanity(lowerContent);
  if (profanityViolation.hasViolation) {
    violations.push(profanityViolation);

    if (messageId) {
      await logViolation(
        userId,
        messageId,
        profanityViolation.violationType!,
        profanityViolation.description!,
        profanityViolation.severity!,
      );
    }
  }

  // 2. Harassment Detection
  const harassmentViolation = detectHarassment(content);
  if (harassmentViolation.hasViolation) {
    violations.push(harassmentViolation);

    if (messageId) {
      await logViolation(
        userId,
        messageId,
        harassmentViolation.violationType!,
        harassmentViolation.description!,
        harassmentViolation.severity!,
      );
    }
  }

  // 3. Spam Detection
  const spamViolation = detectSpam(content);
  if (spamViolation.hasViolation) {
    violations.push(spamViolation);

    if (messageId) {
      await logViolation(
        userId,
        messageId,
        spamViolation.violationType!,
        spamViolation.description!,
        spamViolation.severity!,
      );
    }
  }

  // 4. Length-based violations
  const lengthViolation = detectLengthViolations(content);
  if (lengthViolation.hasViolation) {
    violations.push(lengthViolation);

    if (messageId) {
      await logViolation(
        userId,
        messageId,
        lengthViolation.violationType!,
        lengthViolation.description!,
        lengthViolation.severity!,
      );
    }
  }

  return violations;
}

function detectProfanity(content: string): ViolationResult {
  const foundWords = PROFANITY_WORDS.filter((word) =>
    content.includes(word.toLowerCase()),
  );

  if (foundWords.length > 0) {
    return {
      hasViolation: true,
      violationType: "profanity",
      description: `Contains inappropriate language: ${foundWords.join(", ")}`,
      severity: Math.max(2, Math.min(foundWords.length + 1, 4)), // Min severity 2, max 4
      confidence: 0.8,
    };
  }

  return { hasViolation: false };
}

function detectHarassment(content: string): ViolationResult {
  const matchedPatterns = HARASSMENT_PATTERNS.filter((pattern) =>
    pattern.test(content),
  );

  if (matchedPatterns.length > 0) {
    return {
      hasViolation: true,
      violationType: "harassment",
      description: "Contains harassing or threatening language",
      severity: 4, // High severity for harassment
      confidence: 0.9,
    };
  }

  return { hasViolation: false };
}

function detectSpam(content: string): ViolationResult {
  let spamScore = 0;
  const reasons: string[] = [];

  // Check for repeated characters
  if (SPAM_PATTERNS[0].test(content)) {
    spamScore += 2;
    reasons.push("excessive repeated characters");
  }

  // Check for all caps
  if (SPAM_PATTERNS[1].test(content)) {
    spamScore += 1;
    reasons.push("excessive capitalization");
  }

  // Check for URLs
  if (SPAM_PATTERNS[2].test(content)) {
    spamScore += 3;
    reasons.push("contains URLs");
  }

  // Check message frequency (would need to be implemented with rate limiting)
  // This is a placeholder for more sophisticated spam detection

  if (spamScore >= 3) {
    return {
      hasViolation: true,
      violationType: "spam",
      description: `Potential spam detected: ${reasons.join(", ")}`,
      severity: Math.min(Math.floor(spamScore / 2), 3),
      confidence: 0.7,
    };
  }

  return { hasViolation: false };
}

function detectLengthViolations(content: string): ViolationResult {
  if (content.length > 2000) {
    return {
      hasViolation: true,
      violationType: "excessive_length",
      description: `Message too long (${content.length} characters, max 2000)`,
      severity: 1,
      confidence: 1.0,
    };
  }

  if (content.trim().length === 0) {
    return {
      hasViolation: true,
      violationType: "empty_message",
      description: "Empty or whitespace-only message",
      severity: 1,
      confidence: 1.0,
    };
  }

  return { hasViolation: false };
}

// Advanced detection functions that could be expanded
export function detectRepeatedMessages(
  content: string,
  recentMessages: string[],
): ViolationResult {
  const duplicateCount = recentMessages.filter(
    (msg) => msg.toLowerCase() === content.toLowerCase(),
  ).length;

  if (duplicateCount >= 3) {
    return {
      hasViolation: true,
      violationType: "repeated_messages",
      description: `Message repeated ${duplicateCount} times`,
      severity: 2,
      confidence: 1.0,
    };
  }

  return { hasViolation: false };
}

export function detectRapidPosting(
  timestamps: Date[],
  threshold = 5,
  timeWindow = 60000, // 1 minute
): ViolationResult {
  const now = new Date();
  const recentMessages = timestamps.filter(
    (timestamp) => now.getTime() - timestamp.getTime() < timeWindow,
  );

  if (recentMessages.length >= threshold) {
    return {
      hasViolation: true,
      violationType: "rapid_posting",
      description: `${recentMessages.length} messages in ${timeWindow / 1000} seconds`,
      severity: 3,
      confidence: 1.0,
    };
  }

  return { hasViolation: false };
}
