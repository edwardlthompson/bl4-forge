export type GpRoute =
  | "home"
  | "settings"
  | "about"
  | "feedback"
  | "forge"
  | "guide"
  | "builds"
  | "stats"
  | "specs";
export type FeedbackKind = "bug" | "feature";

export type NavState = {
  stack: GpRoute[];
  feedbackKind?: FeedbackKind;
  scroll: Partial<Record<GpRoute, number>>;
  promptOpen: boolean;
  /** Selected MVP build id when viewing stats. */
  buildId?: string;
};

export const PANEL_ROUTES: readonly GpRoute[] = [
  "settings",
  "about",
  "feedback",
  "forge",
  "guide",
  "builds",
  "stats",
  "specs",
];
