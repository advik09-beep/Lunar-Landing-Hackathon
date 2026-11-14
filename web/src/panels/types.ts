// Lane A panel interface v1.1 (PLAN D9; v1.1 adds onOpenView, approved by both humans 2026-11-14). Lane B mounts panels and owns the shared selection;
// panels never change the selection themselves — they ask through the two callbacks.

export interface PanelProps {
  /** Site id from listSites(), e.g. "sp_malapert". */
  siteId: string;
  /** Landing date, "YYYY-MM-DD" (UTC day). The stay starts at 00:00 UTC that day and lasts VERDICT_RULE.STAY_DAYS. */
  landingDate: string;
  /** Panel asks the shell to select a site (e.g. a grid row click). The shell decides and calls update(). */
  onSiteSelected: (siteId: string) => void;
  /** Panel asks the shell to select a landing date (e.g. "next day", a grid cell). Same rule. */
  onDateSelected: (landingDate: string) => void;
  /** v1.1, optional: panel asks the shell to open another view for the current selection.
   *  Side card: "Stand here" -> "horizon", "Compare other dates" -> "compare". Buttons appear only if given. */
  onOpenView?: (view: "horizon" | "compare") => void;
}

export interface PanelHandle {
  /** Shell pushes a new selection. Only the fields given change. */
  update(next: Partial<Pick<PanelProps, "siteId" | "landingDate">>): void;
  /** Removes the panel's DOM and listeners. The container itself is left in place. */
  destroy(): void;
}

export type MountPanel = (container: HTMLElement, props: PanelProps) => PanelHandle;
