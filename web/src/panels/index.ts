// Lane A panels (PLAN D9). Lane B imports mount functions from here.
export type { PanelProps, PanelHandle, MountPanel } from "./types";
export const PANEL_INTERFACE_VERSION = "1.1";
export { mountSideCard } from "./sideCard";
// Coming next (D9): mountCompareGrid (step 6, includes the timeline strip), mountHorizonView (step 7).
