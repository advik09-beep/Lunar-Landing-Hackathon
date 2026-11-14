// Which LOLA GDR DEMs to use for a site's terrain horizon (D12).
// Polar sites (south of 60.5S): polar stereographic maps,
//   https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
// Other sites (Apollo): simple-cylindrical global maps,
//   https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/
// Every map's label is checked when loaded: "MEAN EARTH/POLAR AXIS OF DE421", heights "relative to a
// radius of 1737.4 km", LSB 16-bit, DN x 0.5 m. A row window is fetched per site where the file is large.
export const FINE = [
  { product: "ldem_80s_20m", maxLat: -80.5 }, // 20 m/px; IM-1 (80.13S) is too close to its 80S edge for a 22 km window
  { product: "ldem_75s_30m", maxLat: -75.5 }, // 30 m/px
  { product: "ldem_60s_60m", maxLat: -60.5 }, // 60 m/px
];
// Polar: whole files used beyond the fine window, finest first.
export const FAR = ["ldem_80s_80m", "ldem_75s_120m", "ldem_60s_240m", "ldem_45s_400m"];
// Global (cylindrical): 1024 px/deg tiles (15 deg lat x 30 deg lon, ~29.6 m/px at the equator) near the
// site, and the 128 px/deg global map (~237 m/px) beyond, both as row windows.
export const GLOBAL_FAR = "ldem_128";
export const GLOBAL_FAR_HALF_DEG = 8;   // rows within +-8 deg latitude of the site (~ +-243 km)
const p2 = (n) => String(n).padStart(2, "0"), p3 = (n) => String(n).padStart(3, "0");
export function tile1024(lat, lon) {
  const lon360 = ((lon % 360) + 360) % 360;
  const a = Math.floor(lat / 15) * 15, b = a + 15, w = Math.floor(lon360 / 30) * 30;
  const band = a >= 0 ? `${p2(a)}n_${p2(b)}n` : b <= 0 ? `${p2(-a)}s_${p2(-b)}s` : null;
  return `ldem_1024_${band}_${p3(w)}_${p3(w + 30)}`;
}
export const isPolar = (lat) => lat <= FINE[FINE.length - 1].maxLat;
export function fineProduct(lat, lon = 0) {
  if (!isPolar(lat)) return tile1024(lat, lon);
  return FINE.find((x) => lat <= x.maxLat).product;
}
export function farProducts(lat) { return isPolar(lat) ? FAR : [GLOBAL_FAR]; }
