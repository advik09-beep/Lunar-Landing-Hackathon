// Script for web/panels.html (Lane A test page). Plays the shell's role from PLAN D9:
// owns the selection, mounts the side card, and applies the panel's selection requests.
import { V } from "./data";
import { mountSideCard } from "./index";

const params = new URLSearchParams(location.search);
const siteSel = document.querySelector<HTMLSelectElement>("#site")!;
const dateIn = document.querySelector<HTMLInputElement>("#date")!;
const log = document.querySelector<HTMLParagraphElement>("#log")!;

for (const s of V.listSites()) siteSel.add(new Option(s.name, s.id));
siteSel.value = params.get("site") ?? "sp_malapert";
dateIn.value = params.get("date") ?? "2026-09-19";

const select = (siteId: string, landingDate: string) => {
  siteSel.value = siteId;
  dateIn.value = landingDate;
  history.replaceState(null, "", `?site=${siteId}&date=${landingDate}`);
  card.update({ siteId, landingDate });
};

const card = mountSideCard(document.querySelector<HTMLElement>("#side-card")!, {
  siteId: siteSel.value,
  landingDate: dateIn.value,
  onSiteSelected: (id) => { log.textContent = `panel asked for site ${id}`; select(id, dateIn.value); },
  onDateSelected: (d) => { log.textContent = `panel asked for date ${d}`; select(siteSel.value, d); },
});

siteSel.addEventListener("change", () => select(siteSel.value, dateIn.value));
dateIn.addEventListener("change", () => { if (dateIn.value) select(siteSel.value, dateIn.value); });
