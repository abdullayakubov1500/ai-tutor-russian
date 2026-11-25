export const FREE_DAILY_SECONDS_LIMIT = 600; // 10 minutes per day
export const FREE_LESSONS_LIMIT = 5;

/**
 * Returns the most recent 12:00:00 (noon) boundary at or before `now`.
 * Free tier resets once per day at noon (12:00).
 */
export function getLastNoonBoundary(now: Date = new Date()): Date {
  const boundary = new Date(now);
  boundary.setHours(12, 0, 0, 0);
  if (now.getTime() < boundary.getTime()) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary;
}

/**
 * Returns the next upcoming 12:00:00 (noon) reset timestamp after `now`.
 */
export function getNextNoonBoundary(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(12, 0, 0, 0);
  if (now.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function shouldResetAtNoon(
  lastResetAt: Date,
  now: Date = new Date()
): boolean {
  const lastNoon = getLastNoonBoundary(now);
  return lastResetAt.getTime() < lastNoon.getTime();
}
