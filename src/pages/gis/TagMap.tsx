import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { fetchTags } from "../../api/tagApi";
import { Tag } from "../../types/tag";
import { tagIcon } from "../../map/MapIcons";
import "leaflet/dist/leaflet.css";
import ZoneBorders from "../../map/ZoneBorders";

export default function TagMap() {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchTags().then(setTags);
  }, []);

  return (
    <>
      {/* Inline CSS for Tag popup */}
      <style>
        {`
          .tag-popup .leaflet-popup-content {
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
        center={[16.266218, 77.85593]}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ✅ Zone multipolygon borders */}
        <ZoneBorders />

        {tags.map((tag) => (
          <Marker
            key={tag.id}
            position={[Number(tag.latitude), Number(tag.longitude)]}
            icon={tagIcon}
          >
            <Popup className="tag-popup" offset={[0, -10]}>
              <div className="popup-container">
                <div className="popup-title">🏷️ Tag Details</div>

                <div className="popup-row">
                  <span className="label">Tag No</span>
                  <span className="value">{tag.tagNo}</span>
                </div>

                <div className="popup-row">
                  <span className="label">Type</span>
                  <span className="value">{tag.tagType}</span>
                </div>
                {/* ✅ Added Zone */}
                <div className="popup-row">
                  <span className="label">Zone</span>
                  <span className="value">
                    {tag.station.division.zone.name}
                  </span>
                </div>
                {/* ✅ Added Division */}
                <div className="popup-row">
                  <span className="label">Division</span>
                  <span className="value">{tag.station.division.name}</span>
                </div>
                <div className="popup-row">
                  <span className="label">Section</span>
                  <span className="value">{tag.section}</span>
                </div>

                <div className="popup-row">
                  <span className="label">Station</span>
                  <span className="value">{tag.station.name}</span>
                </div>

                <div className="popup-row">
                  <span className="label">Road No</span>
                  <span className="value">{tag.roadNo}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
