import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: shadow
});
