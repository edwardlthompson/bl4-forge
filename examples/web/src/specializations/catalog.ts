import catalogJson from "./catalog.json";
import type { SpecCatalog } from "./types";

export function getSpecCatalog(): SpecCatalog {
  return catalogJson as unknown as SpecCatalog;
}
