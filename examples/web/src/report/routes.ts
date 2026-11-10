export type DropStop = { boss: string; location?: string; item: string };

/** Cluster farm route by map/location label. */
export function farmRoute(stops: DropStop[]): Record<string, DropStop[]> {
  const out: Record<string, DropStop[]> = {};
  for (const s of stops) {
    const key = s.location || "unknown";
    (out[key] ??= []).push(s);
  }
  return out;
}
