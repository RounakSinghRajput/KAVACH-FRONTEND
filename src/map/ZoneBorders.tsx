import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { fetchZones } from "../api/zoneApi";

interface Zone {
  id: number;
  name: string;
  geoJson: string; // GeoJSON string from API
}

export default function ZoneBorders() {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    fetchZones().then((data: any[]) => {
      setZones(data);
    });
  }, []);

  return (
    <>
      {zones.map((zone) => {
        if (!zone.geoJson) {
          console.warn("Missing geoJson for zone:", zone);
          return null;
        }

        let geoJsonObject: GeoJSON.GeoJsonObject;

        try {
          geoJsonObject = JSON.parse(zone.geoJson);
        } catch (e) {
          console.error("Invalid GeoJSON for zone:", zone.id, e);
          return null;
        }

        return (
          <GeoJSON
            key={zone.id}
            data={geoJsonObject}
            style={{
              color: "#1d4ed8",
              weight: 2,
              fillOpacity: 0.05,
            }}
          />
        );
      })}
    </>
  );
}
