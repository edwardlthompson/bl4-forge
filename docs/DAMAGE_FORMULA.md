# Damage composition formula

Published contract for the BL4 Forge simulator (`examples/web/src/sim/`). Deterministic; no LLM.

## Point estimate

```
D = base × (1 + Σ add) × Π mul_factor × element × crit × scenario_mods × (1 − splash_self)
```

| Term | Source |
|------|--------|
| `base` | Weapon/item point estimate (`stat_range.damage_median` when present) |
| `Σ add` | Sum of `op: "add"` effects, each scaled by uptime |
| `Π mul_factor` | Product of `op: "mul"` factors after uptime scaling |
| `element` | Element multiplier × `(1 − resist)` |
| `crit` | Crit multiplier for the scenario |
| `scenario_mods` | Named scenario scalar from `data/scenarios/` |
| `splash_self` | Fraction of splash that hits the player (0–1) |

### Uptime scaling

Conditional effects use `data/uptime-tables.json` (per archetype). Effective contribution:

- `add`: `value × uptime`
- `mul`: `1 + (value − 1) × uptime` — so uptime `0` contributes exactly nothing (factor `1`)

`uptime: 0` → contribution `0` for add, factor `1` for mul.

### DSL note

Effect records store `mul` as a **full factor** (e.g. `1.25` for +25% gun damage from the card oracle). That matches `Π mul_factor` above. The classic `(1 + multiplicative)` form is equivalent when multiplicative bonuses are stored as fractions (`0.25`); the DSL does not use that storage shape.

### Unparsed / tag-only

Effects with `unparsed: true` or `tag_only: true` never apply their numeric `value`. They contribute only `tag_count × tag_weight` to the additive sum (default `tag_weight = 0.01`).

## Fire rate and reload

- Fire rate is clamped to `rules.json` → `fire_rate_cap`.
- Magazine DPS uses time-to-empty only: `magazineSize / fireRate`.
- Sustained DPS includes effective reload: `reloadS × (1 − reloadCancel)`.
- Reported `dps` is sustained DPS.

## Variance band

When `stat_range.damage = [low, high]` is present:

- Point estimate uses `damage_median` (or the provided `base`).
- Band scales the composed result by `low/base` and `high/base`.
- `variance.median` echoes `damage_median` as the declared point estimate identity.

## Scenario requirement

No scenario → no score. Every published number must name a scenario under `data/scenarios/`.
