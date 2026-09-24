import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { fetchTowers } from "../../api/towerApi";
import { Tower } from "../../types/tower";
import { towerIcon } from "../../map/MapIcons";
import "leaflet/dist/leaflet.css";
import ZoneBorders from "../../map/ZoneBorders";

export default function TowerMap() {
  const [towers, setTowers] = useState<Tower[]>([]);

  useEffect(() => {
    fetchTowers().then(setTowers);
  }, []);

  return (
    <>
      <style>
        {`
          .tower-popup .leaflet-popup-content {
            margin: 0;
            min-width: 230px;
          }

          .popup-container {
            font-family: "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            padding: 8px;
          }

          .popup-title {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
          }

          .popup-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }

          .popup-row .label {
            font-weight: 500;
            color: #374151;
          }

          .popup-row .value {
            font-weight: 600;
            color: #111827;
          }
        `}
      </style>

      <MapContainer
        center={[19.147887, 77.508756]}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ✅ Zone multipolygon borders */}
        <ZoneBorders />

        {towers.map((tower) => (
          <Marker
            key={tower.id}
            position={[Number(tower.latitude), Number(tower.longitude)]}
            icon={towerIcon}
          >
            <Popup className="tower-popup" offset={[0, -10]}>
              <div className="popup-container">
                <div className="popup-title">🗼 Tower Details</div>

                <div className="popup-row">
                  <span className="label">Asset ID</span>
                  <span className="value">{tower.assetId}</span>
                </div>
                <div className="popup-row">
                  <span className="label">Zone</span>
                  <span className="value">
                    {tower.station.division?.zone?.name ?? "N/A"}
                  </span>
                </div>
                <div className="popup-row">
                  <span className="label">Division</span>
                  <span className="value">
                    {tower.station.division?.name ?? "N/A"}
                  </span>
                </div>

                <div className="popup-row">
                  <span className="label">Station</span>
                  <span className="value">{tower.station.name}</span>
                </div>

                <div className="popup-row">
                  <span className="label">Code</span>
                  <span className="value">{tower.station.code}</span>
                </div>

                {/* <div className="popup-row">
                  <span className="label">Codal Life</span>
                  <span className="value">{tower.codalLife}</span>
                </div>

                <div className="popup-row">
                  <span className="label">Warranty</span>
                  <span className="value">{tower.warrantyPeriod}</span>
                </div> */}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
