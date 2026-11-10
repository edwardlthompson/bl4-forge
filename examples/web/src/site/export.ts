import type { Candidate } from "../solver/types";

export function exportMarkdown(best: Candidate, patch: string): string {
  return [
    `# BL4 Forge build`,
    ``,
    `- Patch: ${patch}`,
    `- Id: ${best.id}`,
    `- Score: ${best.score}`,
    `- Skills: ${best.skills.join(", ") || "(none)"}`,
    `- Gear: ${best.gear.join(", ") || "(none)"}`,
    ``,
  ].join("\n");
}

export function embedCardHtml(title: string, score: number): string {
  return `<aside class="bl4-embed" data-score="${score}"><strong>${escapeHtml(title)}</strong></aside>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
