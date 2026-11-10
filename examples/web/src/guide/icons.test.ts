import { describe, expect, it } from "vitest";
import { iconCandidates, iconUrl, treeClass, treeCssVar } from "./icons";

describe("guide icons", () => {
  it("prefers datamine avif then webp/jpg then mono", () => {
    expect(iconUrl("pb_deadline")).toBe("/icons/datamine/pb_deadline.avif");
    expect(iconCandidates("pb_deadline").fallback).toBe("/icons/datamine/pb_deadline.webp");
    expect(iconCandidates("pb_deadline").tertiary).toBe("/icons/datamine/pb_deadline.jpg");
    expect(iconCandidates("pb_deadline").quaternary).toBe("/icons/mono/pb_deadline.svg");
    expect(iconUrl("gear_waterfall")).toBe("/icons/datamine/gear_waterfall.jpg");
  });

  it("maps tree tokens and classes", () => {
    expect(treeCssVar("remote_agent")).toContain("remote-agent");
    expect(treeClass("people_person")).toBe("gp-guide-tree-people");
    expect(treeClass("this_years_gimmick")).toBe("gp-guide-tree-gimmick");
  });
});
