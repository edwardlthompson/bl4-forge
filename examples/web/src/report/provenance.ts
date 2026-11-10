export type Provenance = {
  game_build: string;
  oracle?: string;
  evidence: Array<{ kind: string; ref?: string; result?: string }>;
  patch: string;
};

export function provenanceDrawer(p: Provenance): Provenance {
  return {
    game_build: p.game_build,
    oracle: p.oracle,
    evidence: [...p.evidence],
    patch: p.patch,
  };
}
