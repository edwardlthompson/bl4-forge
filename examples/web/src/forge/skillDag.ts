/** Skill prerequisite DAG helpers. Cycles fail validation. */

export type SkillNode = {
  id: string;
  requires?: string[];
};

/** Flatten hunters[].skills for DAG checks (typed catalog or scaffold). */
export function skillsFromCatalog(data: { hunters: Array<{ skills: SkillNode[] }> }): SkillNode[] {
  return data.hunters.flatMap((h) => h.skills);
}

export function findSkillCycle(skills: SkillNode[]): string[] | null {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (id: string): string[] | null => {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      return start >= 0 ? [...stack.slice(start), id] : [id, id];
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    stack.push(id);
    const node = byId.get(id);
    for (const req of node?.requires ?? []) {
      if (!byId.has(req)) continue;
      const cycle = dfs(req);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const skill of skills) {
    const cycle = dfs(skill.id);
    if (cycle) return cycle;
  }
  return null;
}

export function assertAcyclicSkills(skills: SkillNode[]): void {
  const cycle = findSkillCycle(skills);
  if (cycle) {
    throw new Error(`Skill DAG cycle detected: ${cycle.join(" -> ")}`);
  }
}
