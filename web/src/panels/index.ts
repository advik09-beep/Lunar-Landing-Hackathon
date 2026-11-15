// Lane A panels (PLAN D9). Lane B imports mount functions from here.
export type { PanelProps, PanelHandle, MountPanel } from "./types";
export const PANEL_INTERFACE_VERSION = "1.4"; // 1.4 (D32): every panel follows level with a seven-year-old Educator view; mountLearn added; planner hides in Educator
export { mountSideCard } from "./sideCard";
export { mountCompareGrid } from "./compareGrid"; // step 6, includes the timeline strip
export { mountHorizonView } from "./horizonView"; // step 7, "Stand here"
export { mountResearcher } from "./researcher"; // D18 Researcher tab
export { mountPlanner } from "./planner"; // D28 A/B scenarios + mission requirements (Researcher only, D32)
export { mountLearn } from "./learn"; // D32 Learn (Educator picture report); mountResearcher shows it when level is "educator"
