import { LatLngTuple } from "leaflet";

/**
 * Converts MULTIPOLYGON WKT to Leaflet-compatible coordinates
 * Supports: MULTIPOLYGON (((lng lat, lng lat, ...)))
 */
export function wktToLatLng(wkt: string): LatLngTuple[][][] {
  if (!wkt || !wkt.startsWith("MULTIPOLYGON")) return [];

  // Remove MULTIPOLYGON(((
  const cleaned = wkt
    .replace("MULTIPOLYGON", "")
    .replace(/\(\(\(/, "")
    .replace(/\)\)\)$/, "");

  // Split polygons (handles spaces safely)
  const polygons = cleaned.split(/\)\),\s*\(\(/);

  return polygons.map((polygon) => {
    const rings = polygon.split(/\),\s*\(/);

    return rings.map((ring) =>
      ring.split(",").map((point) => {
        const [lng, lat] = point.trim().split(/\s+/).map(Number);
        return [lat, lng]; // Leaflet expects [lat, lng]
      })
    );
  });
}
