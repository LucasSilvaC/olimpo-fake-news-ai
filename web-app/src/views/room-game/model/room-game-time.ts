export function deadlineFor(startedAt: string | undefined, durationSeconds: number): number {
  const start = startedAt ? Date.parse(startedAt) : Number.NaN;
  return (Number.isFinite(start) ? start : Date.now()) + (durationSeconds || 30) * 1000;
}

export function secondsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
