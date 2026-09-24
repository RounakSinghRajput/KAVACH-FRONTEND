import L from "leaflet";
import towerPng from "../myGallery/tower.png"; 

export const towerIcon = new L.Icon({
  iconUrl:towerPng,
  iconSize: [35, 45],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

export const tagIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [20, 35],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
