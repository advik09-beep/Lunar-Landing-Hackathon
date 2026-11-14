// Script for web/panels.html (Lane A test page). Plays the shell's role from PLAN D9:
// owns the selection, mounts the side card, and applies the panel's selection requests.
import { V } from "./data";
import { mountSideCard, mountCompareGrid, mountHorizonView, mountResearcher, mountPlanner, type PanelProps } from "./index";

const params = new URLSearchParams(location.search);
const siteSel = document.querySelector<HTMLSelectElement>("#site")!;
const dateIn = document.querySelector<HTMLInputElement>("#date")!;
const log = document.querySelector<HTMLParagraphElement>("#log")!;

for (const s of V.listSites()) siteSel.add(new Option(s.name, s.id));
siteSel.value = params.get("site") ?? V.listSites()[0].id; // D21: no default to any one region
dateIn.value = params.get("date") ?? "2026-09-19";

// The shell owns the selection: panels ask, the shell decides, then updates every panel.
const hourIn = document.querySelector<HTMLInputElement>("#hour")!;
const hourOut = document.querySelector<HTMLOutputElement>("#hour-out")!;
hourIn.value = params.get("hour") ?? "0";
const showHourLabel = () => { hourOut.textContent = `hour ${Number(hourIn.value) + 1} of 168 (${new Date(Date.parse(dateIn.value + "T00:00:00Z") + Number(hourIn.value) * 3.6e6).toISOString().slice(0, 16).replace("T", " ")} UTC)`; };
const select = (siteId: string, landingDate: string, hour = Number(hourIn.value)) => {
  siteSel.value = siteId;
  dateIn.value = landingDate;
  hourIn.value = String(hour);
  showHourLabel();
  history.replaceState(null, "", `?site=${siteId}&date=${landingDate}&hour=${hour}`);
  for (const p of panels) p.update({ siteId, landingDate, hour });
};

const props = (): PanelProps => ({
  siteId: siteSel.value,
  landingDate: dateIn.value,
  hour: Number(hourIn.value),
  onHourSelected: (h) => { log.textContent = `panel asked for hour ${h + 1}`; select(siteSel.value, dateIn.value, h); },
  onSiteSelected: (id) => { log.textContent = `panel asked for site ${id}`; select(id, dateIn.value); },
  onDateSelected: (d) => { log.textContent = `panel asked for date ${d}`; select(siteSel.value, d); },
  onOpenView: (view) => {
    log.textContent = `side card asked to open the ${view} view`;
    const target = view === "horizon" ? "#horizon-view" : "#compare-grid";
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  },
});

const panels = [
  mountSideCard(document.querySelector<HTMLElement>("#side-card")!, props()),
  mountHorizonView(document.querySelector<HTMLElement>("#horizon-view")!, props()),
  mountCompareGrid(document.querySelector<HTMLElement>("#compare-grid")!, props()),
  mountResearcher(document.querySelector<HTMLElement>("#researcher")!, props()),
  mountPlanner(document.querySelector<HTMLElement>("#planner")!, props()),
];

siteSel.addEventListener("change", () => select(siteSel.value, dateIn.value));
dateIn.addEventListener("change", () => { if (dateIn.value) select(siteSel.value, dateIn.value); });
hourIn.addEventListener("input", () => select(siteSel.value, dateIn.value, Number(hourIn.value)));
showHourLabel();
