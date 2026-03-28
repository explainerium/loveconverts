import db from "./db";

export const FREE_DAILY_LIMIT = 20;
export const FREE_MAX_FILE_MB  = 10;
export const PRO_MAX_FILE_MB   = 50;

type Plan = "free" | "pro";

interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  plan: Plan;
  reason?: string;
}

/**
 * Check and increment the daily conversion count for a logged-in user.
 * If the database is unavailable (Vercel), always allow the request.
 */
export function checkAndIncrementLimit(
  userId: string,
  fileSizeMB?: number
): LimitCheckResult {
  // No database → allow everything (Vercel stateless mode)
  if (!db) return { allowed: true, remaining: Infinity, plan: "free" };

  const user = db
    .prepare("SELECT plan FROM users WHERE id = ?")
    .get(userId) as { plan: Plan } | undefined;

  if (!user) return { allowed: false, remaining: 0, plan: "free", reason: "User not found" };

  const plan = user.plan as Plan;

  if (fileSizeMB !== undefined) {
    const maxMB = plan === "pro" ? PRO_MAX_FILE_MB : FREE_MAX_FILE_MB;
    if (fileSizeMB > maxMB) {
      return {
        allowed: false, remaining: 0, plan,
        reason: `File too large. ${plan === "free" ? "Free plan max is 10 MB." : "Pro plan max is 50 MB."}`,
      };
    }
  }

  if (plan === "pro") {
    return { allowed: true, remaining: Infinity, plan };
  }

  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare("SELECT count FROM daily_usage WHERE user_id = ? AND date = ?")
    .get(userId, today) as { count: number } | undefined;

  const current = row?.count ?? 0;
  if (current >= FREE_DAILY_LIMIT) {
    return {
      allowed: false, remaining: 0, plan,
      reason: `Daily limit of ${FREE_DAILY_LIMIT} conversions reached. Upgrade to Pro for unlimited.`,
    };
  }

  db.prepare(`
    INSERT INTO daily_usage (user_id, date, count) VALUES (?, ?, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET count = count + 1
  `).run(userId, today);

  return { allowed: true, remaining: FREE_DAILY_LIMIT - current - 1, plan };
}

/**
 * Record a conversion in the database.
 * Silently skips if database is unavailable.
 */
export function recordConversion(opts: {
  userId: string;
  filename: string;
  fromFormat: string;
  toFormat: string;
  tool: string;
  originalSize: number;
  convertedSize: number;
}) {
  if (!db) return;

  try {
    db.prepare(`
      INSERT INTO conversions (id, user_id, filename, from_format, to_format, tool, original_size, converted_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      opts.userId,
      opts.filename,
      opts.fromFormat,
      opts.toFormat,
      opts.tool,
      opts.originalSize,
      opts.convertedSize
    );
  } catch { /* silent on Vercel */ }
}
