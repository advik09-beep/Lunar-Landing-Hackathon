// Panel interface v1.3 (PLAN D9; v1.1 onOpenView; v1.2 shared hour (D13); v1.3 shared reading level (D30), 2026-11-14). Lane B mounts panels and owns the shared selection;
// panels never change the selection themselves — they ask through the two callbacks.

export interface PanelProps {
  /** Site id from listSites(). */
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
  /** v1.2, optional: hour within the stay, 0 .. STAY_DAYS*24-1 (0 = landing date 00:00 UTC). Default 0.
   *  Side card and horizon view show this hour; the Compare strip marks it. */
  hour?: number;
  /** v1.2, optional: panel asks the shell to change the shared hour (e.g. the horizon view's slider).
   *  If given, panels never change the hour themselves; the shell decides and calls update({ hour }).
   *  If omitted, the horizon view keeps its own local hour as in v1.1. */
  onHourSelected?: (hour: number) => void;
  /** v1.3, optional: reading level from the shell's single Educator / Researcher switch (D30).
   *  When given, panels follow it and hide their own switches. */
  level?: "educator" | "researcher";
}

export interface PanelHandle {
  /** Shell pushes a new selection. Only the fields given change. */
  update(next: Partial<Pick<PanelProps, "siteId" | "landingDate" | "hour" | "level">>): void;
  /** Removes the panel's DOM and listeners. The container itself is left in place. */
  destroy(): void;
}

export type MountPanel = (container: HTMLElement, props: PanelProps) => PanelHandle;
