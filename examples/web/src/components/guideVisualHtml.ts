/** Tiny ADHD-friendly HTML atoms for the build guide lower half. */

export function chip(text: string, cls = ""): string {
  const c = cls ? ` gp-guide-chip--${cls}` : "";
  return `<span class="gp-guide-chip${c}">${text}</span>`;
}

export function meterRow(label: string, pct: number, maxPct: number, detail?: string): string {
  const width = maxPct > 0 ? Math.min(100, Math.round((Math.abs(pct) / maxPct) * 100)) : 0;
  const sign = pct >= 0 ? "+" : "";
  return `<li class="gp-guide-meter">
    <div class="gp-guide-meter-head">
      <strong>${label}</strong>
      <span class="gp-guide-meter-val">${sign}${pct}%</span>
    </div>
    <div class="gp-guide-meter-track" role="presentation">
      <div class="gp-guide-meter-fill" style="width:${width}%"></div>
    </div>
    ${detail ? `<p class="gp-guide-meter-detail">${detail}</p>` : ""}
  </li>`;
}

export function detailsBlock(summary: string, body: string, testid?: string): string {
  const attr = testid ? ` data-testid="${testid}"` : "";
  return `<details class="gp-guide-more"${attr}>
    <summary>${summary}</summary>
    <div class="gp-guide-more-body">${body}</div>
  </details>`;
}

export function heroCallout(title: string, body: string, testid?: string): string {
  const attr = testid ? ` data-testid="${testid}"` : "";
  return `<div class="gp-guide-hero-callout"${attr}>
    <p class="gp-guide-hero-eyebrow">${title}</p>
    <p class="gp-guide-hero-body">${body}</p>
  </div>`;
}
