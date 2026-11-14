// D19 (both humans, 2026-11-14): the Sun and Earth as discs, Earth's shadow, and the actual Sun distance.
// Sources (all NASA NSSDCA fact sheets, read 2026-11-14):
//   Sun "Volumetric mean radius (km) 695,700."            https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
//   Earth "Equatorial radius (km) 6378.137"              https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
//   Earth "Solar irradiance (W/m2) 1361.0" and "Semimajor axis (10^6 km) 149.598" (same page): we read 1361 W/m²
//   as the value at that mean distance and scale it by (149.598e6 km / actual Sun distance)².
// Small-angle, flat-sky geometry is used for discs a fraction of a degree to ~1 degree across.
export const SUN_RADIUS_KM = 695700;
export const EARTH_EQ_RADIUS_KM = 6378.137;
export const IRRADIANCE_AT_MEAN_W_M2 = 1361.0;
export const MEAN_SUN_DISTANCE_KM = 149.598e6;
export const DISC_SOURCES = {
  sunRadius: "NASA NSSDCA Sun Fact Sheet, 'Volumetric mean radius (km) 695,700.'",
  earthRadius: "NASA NSSDCA Earth Fact Sheet, 'Equatorial radius (km) 6378.137'",
  irradiance: "NASA NSSDCA Earth Fact Sheet, 'Solar irradiance (W/m2) 1361.0' with 'Semimajor axis (10^6 km) 149.598' (Moon Fact Sheet gives the same 1361.0 for the Moon)",
};
const r2d = 180 / Math.PI;

/** Angular radius (degrees) of a body of radius R (km) at distance d (km). */
export const angularRadiusDeg = (R, d) => Math.asin(R / d) * r2d;

/** Share (0..1) of a disc of angular radius r whose centre is h degrees above a straight skyline. */
export function discFractionAbove(h, r) {
  if (h >= r) return 1;
  if (h <= -r) return 0;
  const x = h / r; // circular-segment area: share BELOW = (acos(x) - x*sqrt(1-x^2)) / pi
  return 1 - (Math.acos(x) - x * Math.sqrt(1 - x * x)) / Math.PI;
}

/** Share (0..1) of disc A (radius a) covered by disc B (radius b), centres d apart (all degrees). */
export function discCoveredFraction(d, a, b) {
  if (d >= a + b) return 0;
  if (d <= b - a) return 1;               // A entirely inside B
  if (d <= a - b) return (b * b) / (a * a); // B entirely inside A
  const A = a * a * Math.acos((d * d + a * a - b * b) / (2 * d * a));
  const B = b * b * Math.acos((d * d + b * b - a * a) / (2 * d * b));
  const C = 0.5 * Math.sqrt((-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b));
  return (A + B - C) / (Math.PI * a * a);
}

/** Angle (degrees) between two directions given as elevation/azimuth (degrees). */
export function separationDeg(el1, az1, el2, az2) {
  const d2r = Math.PI / 180;
  const c = Math.sin(el1 * d2r) * Math.sin(el2 * d2r) + Math.cos(el1 * d2r) * Math.cos(el2 * d2r) * Math.cos((az1 - az2) * d2r);
  return Math.acos(Math.max(-1, Math.min(1, c))) * r2d;
}
