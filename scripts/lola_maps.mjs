// Which LOLA GDR polar DEM is the finest one covering a site (D12 stage 2). Products and their
// labels: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
// All are polar stereographic centred on -90, "MEAN EARTH/POLAR AXIS OF DE421", heights relative to
// 1737.4 km (checked from each .lbl when loaded). A +-22 km row window of the fine product is fetched per site.
export const FINE = [
  { product: "ldem_80s_20m", maxLat: -80.5 }, // 20 m/px; IM-1 (80.13S) is too close to its 80S edge for a 22 km window
  { product: "ldem_75s_30m", maxLat: -75.5 }, // 30 m/px
  { product: "ldem_60s_60m", maxLat: -60.5 }, // 60 m/px
];
// Whole files used beyond the fine window, finest first.
export const FAR = ["ldem_80s_80m", "ldem_75s_120m", "ldem_60s_240m", "ldem_45s_400m"];
export function fineProduct(lat) {
  const f = FINE.find((x) => lat <= x.maxLat);
  if (!f) throw new Error(`no polar LOLA product with a fine window covers latitude ${lat}`);
  return f.product;
}
