/** Resolve skill/slot icon: datamine (avif/webp/jpg) first, mono SVG last resort. */

export function iconUrl(id: string): string {
  return iconCandidates(id).primary;
}

const JPG_PRIMARY = new Set(["gear_waterfall", "slot_grenade"]);

export function iconCandidates(id: string): {
  primary: string;
  fallback: string;
  tertiary: string;
  quaternary: string;
} {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const avif = `/icons/datamine/${safe}.avif`;
  const webp = `/icons/datamine/${safe}.webp`;
  const jpg = `/icons/datamine/${safe}.jpg`;
  const mono = `/icons/mono/${safe}.svg`;
  if (JPG_PRIMARY.has(safe)) {
    return { primary: jpg, fallback: avif, tertiary: webp, quaternary: mono };
  }
  return { primary: avif, fallback: webp, tertiary: jpg, quaternary: mono };
}

export function treeCssVar(treeId: string): string {
  switch (treeId) {
    case "remote_agent":
      return "var(--guide-tree-remote-agent)";
    case "people_person":
      return "var(--guide-tree-people-person)";
    case "this_years_gimmick":
      return "var(--guide-tree-gimmick)";
    default:
      return "var(--gp-color-on-surface)";
  }
}

export function treeClass(treeId: string): string {
  switch (treeId) {
    case "remote_agent":
      return "gp-guide-tree-remote";
    case "people_person":
      return "gp-guide-tree-people";
    case "this_years_gimmick":
      return "gp-guide-tree-gimmick";
    default:
      return "gp-guide-tree-default";
  }
}
