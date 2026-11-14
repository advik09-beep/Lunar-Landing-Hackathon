// Lane A panels (PLAN D9). Lane B imports mount functions from here.
export type { PanelProps, PanelHandle, MountPanel } from "./types";
export const PANEL_INTERFACE_VERSION = "1.3";
export { mountSideCard } from "./sideCard";
export { mountCompareGrid } from "./compareGrid"; // step 6, includes the timeline strip
export { mountHorizonView } from "./horizonView"; // step 7, "Stand here"
export { mountResearcher } from "./researcher"; // D18 Researcher tab
export { mountPlanner } from "./planner"; // D28 A/B scenarios + mission requirements
