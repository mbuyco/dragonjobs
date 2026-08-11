/** True when postedAt is finite and at or after (now - hours). Missing/invalid → false. */
export function isWithinLookback(
  postedAt: Date | undefined,
  hours: number,
  now: Date = new Date(),
): boolean {
  if (!postedAt || Number.isNaN(postedAt.getTime())) return false
  const cutoffMs = now.getTime() - hours * 60 * 60 * 1000
  return postedAt.getTime() >= cutoffMs
}
