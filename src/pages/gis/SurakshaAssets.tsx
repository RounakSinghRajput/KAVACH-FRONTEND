import React, { useEffect, useRef, useState, useMemo } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import XYZ from "ol/source/XYZ";
import { fromLonLat, transformExtent } from "ol/proj";
import Overlay from "ol/Overlay";
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Checkbox,
  Paper,
  Divider,
  Button,
  IconButton,
  Grid,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  List,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import LayersIcon from "@mui/icons-material/Layers";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MapIcon from "@mui/icons-material/Map";
import SatelliteIcon from "@mui/icons-material/Satellite";
import PublicIcon from "@mui/icons-material/Public";
import "ol/ol.css";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import axios from "axios";

type BasemapType = "BHUVAN_MAP" | "GOOGLE_SATELLITE" | "OSM";

const SURAKSHA_SUB_LAYERS = [
  { id: "suraksha_comissioned_stations", label: "Commissioned Stations" },
  { id: "suraksha_kavach_tower", label: "Kavach Towers" },
  { id: "suraksha_add_srj_points", label: "SRJ Points" },
  { id: "suraksha_signal", label: "Signals" },
  { id: "suraksha_kavach_rfid_tags", label: "Kavach RFID Tags" },
  { id: "suraksha_turnout_tag", label: "Turnout Tags" },
  { id: "suraksha_signal_foot_tag", label: "Signal Foot Tags" },
  { id: "suraksha_normal_tag", label: "Normal Tags" },
  { id: "suraksha_gate_tag", label: "Gate Tags" },
  { id: "suraksha_exit_tag", label: "Exit Tags" },
  { id: "suraksha_dead_stop_tag", label: "Dead Stop Tags" },
  { id: "suraksha_adjustment_junction_tag", label: "Adjustment Junction Tags" },
  { id: "suraksha_adjacent_line_info_tag", label: "Adjustment Line Info Tags" },
  { id: "suraksha_track_circuit_line", label: "Track Circuit Lines" },
  { id: "suraksha_kavach_rfid_tags_area", label: "RFID Tags Area" },
];

const SIGNALLING_CATEGORIES = [
  {
    id: "signals",
    label: "Signals",
    layers: [
      {
        id: "les_signal_shunt",
        layerName: "LES_signal_shunt",
        label: "LES Signal Shunt",
      },
      {
        id: "ler_signal",
        layerName: "LER_signal_starter_indicator",
        label: "LER Signal",
      },
      {
        id: "lrp_signal",
        layerName: "LRP_signal_repeating",
        label: "LRP Signal",
      },
      {
        id: "spi_indicator",
        layerName: "SPI_signal_shunt_permit_indicator",
        label: "SPI Indicator",
      },
      {
        id: "lec_calling",
        layerName: "LEC_signal_calling_on",
        label: "LEC Calling",
      },
      {
        id: "led_main",
        layerName: "LED_signal_main",
        label: "LED Main",
      },
      {
        id: "lem_marker",
        layerName: "LEM_signal_f_marker",
        label: "LEM Marker",
      },
    ],
  },

  {
    id: "track_circuits",
    label: "Track Circuits",
    layers: [
      {
        id: "dct_track_circuit",
        layerName: "DCT_track_circuit",
        label: "DCT Track Circuit",
      },
    ],
  },

  {
    id: "points",
    label: "Points",
    layers: [
      {
        id: "sop_point",
        layerName: "SOP_electrically_operated_point(hv)",
        label: "SOP Point",
      },
      {
        id: "eop_point",
        layerName: "EOP_electrically_operated_point",
        label: "EOP Point",
      },
      {
        id: "edp_detector",
        layerName: "EPD_electrical_point_detector",
        label: "EDP Detector",
      },
    ],
  },
];

const SIGNALLING_SUB_LAYERS = SIGNALLING_CATEGORIES.flatMap(
  (category) => category.layers,
);

const LAYER_POPUP_FIELDS: Record<string, string[]> = {
  suraksha_comissioned_stations: [
    "sttn_id",
    "sttn_code",
    "sttn_nme",
    "zone",
    "division",
  ],
  suraksha_kavach_tower: [
    "asset_id",
    "asset_name",
    "kvch_sttn",
    "codal_life",
    "warranty_p",
    "railway",
    "division",
  ],
  suraksha_add_srj_points: ["asset_name", "railway", "division"],
  suraksha_signal: ["gear_name", "type", "chainage"],
  suraksha_kavach_rfid_tags: [
    "tag_no",
    "tag_type",
    "road_no",
    "railway",
    "division",
    "section",
  ],
  suraksha_turnout_tag: [
    "tag_no",
    "descriptn",
    "bit_pstn",
    "sttn_code",
    "sttn_nme",
    "zone",
    "division",
    "section",
  ],
  suraksha_signal_foot_tag: [
    "tag_no",
    "descriptn",
    "bit_pstn",
    "sttn_code",
    "sttn_nme",
    "zone",
    "division",
    "section",
  ],
};

interface PopupData {
  layerName: string;
  attributes: Record<string, any>;
  displayFields: string[];
}

const DEFAULT_CENTER = [79.9629, 23.1937];
const DEFAULT_ZOOM = 5;

const GisMapPage = () => {
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(true);
  const [showStation, setShowStation] = useState<boolean>(true);
  const [showTrack, setShowTrack] = useState<boolean>(false);
  const [showZone, setShowZone] = useState(false);
  const [showIndiaBoundary, setShowIndiaBoundary] = useState(true);

  const [weatherData, setWeatherData] = useState([]);
const [showWeather, setShowWeather] = useState(true);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>("OSM");
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [subLayerVisibility, setSubLayerVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    SURAKSHA_SUB_LAYERS.forEach((layer) => {
      initialState[layer.id] = false;
    });
    return initialState;
  });

  const [signallingLayerVisibility, setSignallingLayerVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};

    SIGNALLING_CATEGORIES.forEach((category) => {
      category.layers.forEach((layer) => {
        initialState[layer.id] = false;
      });
    });

    return initialState;
  });

  const [stationOptions, setStationOptions] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [isPopupLoading, setIsPopupLoading] = useState<boolean>(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Separate dynamic datasets parsed from layer schemas
  const [stationZones, setStationZones] = useState<string[]>([]);
  const [stationDivisions, setStationDivisions] = useState<string[]>([]);
  const [commissionedZones, setCommissionedZones] = useState<string[]>([]);
  const [commissionedDivisions, setCommissionedDivisions] = useState<string[]>(
    [],
  );
  const [commissionedFirms, setCommissionedFirms] = useState<string[]>([]);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);

  // Distinct hook filter criteria states
  const [selectedStationZone, setSelectedStationZone] = useState<string>("ALL");
  const [selectedStationDivision, setSelectedStationDivision] =
    useState<string>("ALL");
  const [selectedCommZone, setSelectedCommZone] = useState<string>("ALL");
  const [selectedCommDivision, setSelectedCommDivision] =
    useState<string>("ALL");
  const [selectedCommFirm, setSelectedCommFirm] = useState<string>("ALL");

  const [showBasemapPanel, setShowBasemapPanel] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const basemapsRef = useRef<{
    OSM?: TileLayer<OSM>;
    BHUVAN_MAP?: TileLayer<TileWMS>;
    GOOGLE_SATELLITE?: TileLayer<XYZ>;
  }>({});
  const layersRef = useRef<{
    station?: TileLayer<TileWMS>;
    track?: TileLayer<TileWMS>;
    zone?: TileLayer<TileWMS>;
    indiaBoundary?: TileLayer<TileWMS>;
    surakshaBoundary?: TileLayer<TileWMS>;
    assets?: TileLayer<TileWMS>;
    signallingAssets?: TileLayer<TileWMS>;
  }>({});
  const searchMarkerSourceRef = useRef(new VectorSource());

  const weatherSourceRef = useRef(new VectorSource());

const weatherLayerRef = useRef(
  new VectorLayer({
    source: weatherSourceRef.current,
  })
);

  const searchMarkerLayerRef = useRef(
    new VectorLayer({
      source: searchMarkerSourceRef.current,
    }),
  );

  const activeSubLayersString = useMemo(() => {
    if (!isMapInitialized) return "P_SURAKSHA:none";
    const active = [...SURAKSHA_SUB_LAYERS]
      .reverse()
      .filter((layer) => subLayerVisibility[layer.id])
      .map((layer) => `P_SURAKSHA:${layer.id}`)
      .join(",");
    return active || "P_SURAKSHA:none";
  }, [subLayerVisibility, isMapInitialized]);

  const activeSignallingLayersString = useMemo(() => {
    if (!isMapInitialized) return "P_SMMS:none";

    const allLayers = SIGNALLING_CATEGORIES.flatMap(
      (category) => category.layers,
    );

    const active = [...allLayers]
      .reverse()
      .filter((layer) => signallingLayerVisibility[layer.id])
      .map((layer) => `P_SMMS:${layer.layerName}`)
      .join(",");

    return active || "P_SMMS:none";
  }, [signallingLayerVisibility, isMapInitialized]);
  const loadStations = async () => {
    try {
      const url =
        "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wfs" +
        "?service=WFS" +
        "&version=1.0.0" +
        "&request=GetFeature" +
        "&typeName=P_SMMS:railway_station" +
        "&propertyName=sttncode,sttnname" +
        "&outputFormat=application/json";
      const response = await fetch(url);
      const data = await response.json();
      const stations =
        data.features?.map((f: any) => ({
          code: f.properties.sttncode,
          name: f.properties.sttnname,
        })) || [];

      setStationOptions(stations);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  // Background fetch engine for standard Railway Stations properties
  useEffect(() => {
    if (!showStation && !showTrack) return;
    const fetchStationFilters = async () => {
      try {
        const url = `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=P_SMMS:railway_station&maxFeatures=10000&outputFormat=application/json`;
        const res = await fetch(url);
        const data = await res.json();

        const zones = new Set<string>();
        const divisions = new Set<string>();

        data.features?.forEach((f: any) => {
          const p = f.properties || {};

          if (p.railway) zones.add(p.railway);

          if (p.division) divisions.add(p.division);
        });

        setStationZones(Array.from(zones).sort());
        setStationDivisions(Array.from(divisions).sort());
      } catch (e) {
        console.error("Failed fetching distinct station attributes", e);
      }
    };
    fetchStationFilters();
  }, [showStation, showTrack]);
  useEffect(() => {
    const loadDivisionsByRailway = async () => {
      if (selectedStationZone === "ALL") {
        return;
      }

      try {
        const url =
          `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
          `?service=WFS` +
          `&version=1.0.0` +
          `&request=GetFeature` +
          `&typeName=P_SMMS:railway_station` +
          `&cql_filter=${encodeURIComponent(
            `railway='${selectedStationZone}'`,
          )}` +
          `&outputFormat=application/json`;

        const response = await fetch(url);
        const data = await response.json();

        const divisions = new Set<string>();

        data.features?.forEach((f: any) => {
          if (f.properties?.division) {
            divisions.add(f.properties.division);
          }
        });

        setStationDivisions(Array.from(divisions).sort());
      } catch (err) {
        console.error("Division Load Error", err);
      }
    };

    loadDivisionsByRailway();
  }, [selectedStationZone]);
  useEffect(() => {
    if (selectedCommZone === "ALL") {
      return;
    }

    const loadCommissionedDivisions = async () => {
      const url =
        `https://suraksha.indianrailways.gov.in/geoserver/P_SURAKSHA/ows` +
        `?service=WFS` +
        `&version=1.0.0` +
        `&request=GetFeature` +
        `&typeName=P_SURAKSHA:suraksha_comissioned_stations` +
        `&cql_filter=${encodeURIComponent(`zone='${selectedCommZone}'`)}` +
        `&outputFormat=application/json`;

      const res = await fetch(url);

      const data = await res.json();

      const divisions = new Set<string>();

      data.features?.forEach((f: any) => {
        if (f.properties?.division) {
          divisions.add(f.properties.division);
        }
      });

      setCommissionedDivisions(Array.from(divisions).sort());
    };

    loadCommissionedDivisions();
  }, [selectedCommZone]);

  // Background fetch engine for specialized Commissioned Stations properties
  useEffect(() => {
    if (!subLayerVisibility.suraksha_comissioned_stations) return;
    const fetchCommissionedFilters = async () => {
      try {
        const url = `https://suraksha.indianrailways.gov.in/geoserver/P_SURAKSHA/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=P_SURAKSHA:suraksha_comissioned_stations&maxFeatures=5000&outputFormat=application/json`;
        const res = await fetch(url);
        const data = await res.json();

        const zones = new Set<string>();
        const divisions = new Set<string>();
        const firms = new Set<string>();

        data.features?.forEach((f: any) => {
          const p = f.properties || {};
          if (p.zone) zones.add(p.zone);
          if (p.division) divisions.add(p.division);
          if (p.firm) firms.add(p.firm);
        });

        setCommissionedZones(Array.from(zones).sort());
        setCommissionedDivisions(Array.from(divisions).sort());
        setCommissionedFirms(Array.from(firms).sort());
      } catch (e) {
        console.error("Failed fetching distinct commissioned features", e);
      }
    };
    fetchCommissionedFilters();
  }, [subLayerVisibility.suraksha_comissioned_stations]);

  useEffect(() => {
    if (!mapRef.current) return;

    const osmLayer = new TileLayer({ source: new OSM(), visible: false });
    const bhuvanMapLayer = new TileLayer({
      source: new TileWMS({
        url: "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms",
        params: {
          LAYERS: "india3",

          FORMAT: "image/jpeg",
          // VERSION: "1.1.1",
          TILED: true,
          TRANSPARENT: true,
        },
        crossOrigin: "anonymous",
      }),
      visible: true,
    });
    bhuvanMapLayer.getSource()?.on("tileloadend", (e: any) => {
      const img = e.tile.getImage();

      console.log("Bhuvan Tile Loaded", img.naturalWidth, img.naturalHeight);
    });

    const googleSatelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        attributions: "© Google Maps Satellite",
      }),
      visible: false,
    });

    basemapsRef.current = {
      OSM: osmLayer,
      BHUVAN_MAP: bhuvanMapLayer,
      GOOGLE_SATELLITE: googleSatelliteLayer,
    };

    const stationLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: { LAYERS: "SMMS_GIS:railway_station", TILED: true },
      }),
      visible: true,
    });
    const trackLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: { LAYERS: "SMMS_GIS:railway_track_yard_lines", TILED: true },
      }),
      visible: false,
    });
    const zoneLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: {
          LAYERS: "P_SMMS:zone",
          TILED: true,
        },
      }),
      visible: false,
    });
    const indiaBoundaryLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: {
          LAYERS: "P_SMMS:india_boundary",
          TILED: true,
        },
      }),
      visible: true,
    });

    const assetsLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SURAKSHA/wms",
        params: { LAYERS: "P_SURAKSHA:none", TILED: true },
      }),
      visible: false,
    });

    const signallingAssetsLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: {
          LAYERS: "P_SMMS:none",
          TILED: true,
        },
      }),
      visible: false,
    });
    layersRef.current = {
      station: stationLayer,
      track: trackLayer,
      zone: zoneLayer,
      indiaBoundary: indiaBoundaryLayer,
      assets: assetsLayer,
      signallingAssets: signallingAssetsLayer,
    };
    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } },
      positioning: "bottom-center",
      stopEvent: true,
    });
    overlayRef.current = overlay;

    const map = new Map({
      target: mapRef.current,
      layers: [
        osmLayer,
        bhuvanMapLayer,
        googleSatelliteLayer,
        indiaBoundaryLayer,
        zoneLayer,
        trackLayer,
        stationLayer,
weatherLayerRef.current,
        assetsLayer,
        signallingAssetsLayer,
        searchMarkerLayerRef.current,
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
      }),
    });
    mapInstanceRef.current = map;

    map.getView().on("change:resolution", () => {
      const zoom = map.getView().getZoom();
      if (zoom !== undefined) {
        setCurrentZoom(Math.round(zoom * 10) / 10);
      }
    });

    map.on("singleclick", async (evt) => {
      const view = map.getView();
      const viewResolution = view.getResolution();
      const projection = view.getProjection();

      setPopupData(null);
      setIsPopupLoading(true);
      overlay.setPosition(evt.coordinate);

      const targetSearchLayers = [
        stationLayer,
        trackLayer,
        assetsLayer,
        signallingAssetsLayer,
      ];
      let featureCaptured = false;

      for (const layer of targetSearchLayers) {
        if (!layer.getVisible()) continue;
        const wmsSource = layer.getSource();
        const url = wmsSource?.getFeatureInfoUrl(
          evt.coordinate,
          viewResolution!,
          projection,
          {
            INFO_FORMAT: "application/json",
            FEATURE_COUNT: 1,
          },
        );

        if (url) {
          try {
            const response = await fetch(url);
            const data = await response.json();

            if (data?.features?.length > 0) {
              const feature = data.features[0];
              const rawId = feature.id || "";
              const layerKey = rawId.includes(".")
                ? rawId.split(".")[0].split(":").pop()
                : rawId;
              const props = feature.properties || {};

              setPopupData({
                layerName: layerKey || "Unknown Layer",
                attributes: props,
                displayFields:
                  LAYER_POPUP_FIELDS[layerKey] || Object.keys(props),
              });
              featureCaptured = true;
              break;
            }
          } catch (err) {
            console.error("WMS click parse failure:", err);
          }
        }
      }

      setIsPopupLoading(false);
      if (!featureCaptured) overlayRef.current?.setPosition(undefined);
    });

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

useEffect(()=>{

    fetchWeather();

    const timer=setInterval(fetchWeather,600000);

    return ()=>clearInterval(timer);

},[]);
useEffect(() => {
  weatherSourceRef.current.clear();
  weatherData.forEach((item)=>{

});

}, [weatherData]);


  useEffect(() => {
    if (basemapsRef.current.OSM)
      basemapsRef.current.OSM.setVisible(activeBasemap === "OSM");
    if (basemapsRef.current.BHUVAN_MAP)
      basemapsRef.current.BHUVAN_MAP.setVisible(activeBasemap === "BHUVAN_MAP");
    if (basemapsRef.current.GOOGLE_SATELLITE)
      basemapsRef.current.GOOGLE_SATELLITE.setVisible(
        activeBasemap === "GOOGLE_SATELLITE",
      );
  }, [activeBasemap]);

  useEffect(() => {
    layersRef.current.station?.setVisible(isMapInitialized && showStation);
  }, [showStation, isMapInitialized]);

  useEffect(() => {
    layersRef.current.track?.setVisible(isMapInitialized && showTrack);
  }, [showTrack, isMapInitialized]);

  useEffect(() => {
    layersRef.current.zone?.setVisible(isMapInitialized && showZone);
  }, [showZone, isMapInitialized]);

  useEffect(() => {
    layersRef.current.indiaBoundary?.setVisible(showIndiaBoundary);
  }, [showIndiaBoundary]);

  useEffect(() => {
    if (layersRef.current.assets) {
      const hasLayers =
        isMapInitialized && activeSubLayersString !== "P_SURAKSHA:none";
      layersRef.current.assets.setVisible(hasLayers);
      layersRef.current.assets
        .getSource()
        ?.updateParams({ LAYERS: activeSubLayersString });
    }
  }, [activeSubLayersString, isMapInitialized]);

  useEffect(() => {
    if (layersRef.current.signallingAssets) {
      const hasLayers =
        isMapInitialized && activeSignallingLayersString !== "P_SMMS:none";

      layersRef.current.signallingAssets.setVisible(hasLayers);

      layersRef.current.signallingAssets.getSource()?.updateParams({
        LAYERS: activeSignallingLayersString,
      });

      layersRef.current.signallingAssets.getSource()?.refresh();
    }
  }, [activeSignallingLayersString, isMapInitialized]);

  // Dual engine multi-layer parameter configuration updates
  useEffect(() => {
    const stationFilters: string[] = [];
    if (selectedStationZone !== "ALL") {
      stationFilters.push(`railway='${selectedStationZone}'`);
    }
    if (selectedStationDivision !== "ALL") {
      stationFilters.push(`division = '${selectedStationDivision}'`);
    }
    const stationCql =
      stationFilters.length > 0 ? stationFilters.join(" AND ") : undefined;
    console.log("Station Filter:", stationCql);
    layersRef.current.station
      ?.getSource()
      ?.updateParams({ CQL_FILTER: stationCql });
    layersRef.current.station?.getSource()?.refresh();
    layersRef.current.track
      ?.getSource()
      ?.updateParams({ CQL_FILTER: stationCql });
    layersRef.current.track?.getSource()?.refresh();

    const commFilters: string[] = [];
    if (selectedCommZone !== "ALL")
      commFilters.push(`zone = '${selectedCommZone}'`);
    if (selectedCommDivision !== "ALL")
      commFilters.push(`division = '${selectedCommDivision}'`);
    if (selectedCommFirm !== "ALL")
      commFilters.push(`firm = '${selectedCommFirm}'`);
    const commCql =
      commFilters.length > 0 ? commFilters.join(" AND ") : undefined;
    console.log("Commissioned Filter:", commCql);
    layersRef.current.assets
      ?.getSource()
      ?.updateParams({ CQL_FILTER: commCql });
    layersRef.current.assets?.getSource()?.refresh();

    overlayRef.current?.setPosition(undefined);
    setPopupData(null);
  }, [
    selectedStationZone,
    selectedStationDivision,
    selectedCommZone,
    selectedCommDivision,
    selectedCommFirm,
  ]);

  // Unified cluster layout auto-fit view effect bounding engine
  useEffect(() => {
    const triggerDynamicZoom = async () => {
      if (!mapInstanceRef.current) return;

      let targetUrl = "";
      const filters: string[] = [];

      if (
        selectedCommZone !== "ALL" ||
        selectedCommDivision !== "ALL" ||
        selectedCommFirm !== "ALL"
      ) {
        if (selectedCommZone !== "ALL")
          filters.push(`zone='${selectedCommZone}'`);
        if (selectedCommDivision !== "ALL")
          filters.push(`division='${selectedCommDivision}'`);
        if (selectedCommFirm !== "ALL")
          filters.push(`firm='${selectedCommFirm}'`);
        targetUrl = `https://suraksha.indianrailways.gov.in/geoserver/P_SURAKSHA/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=P_SURAKSHA:suraksha_comissioned_stations&cql_filter=${encodeURIComponent(filters.join(" AND "))}&outputFormat=application/json&srsName=EPSG:4326`;
      } else if (
        selectedStationZone !== "ALL" ||
        selectedStationDivision !== "ALL"
      ) {
        if (selectedStationZone !== "ALL") {
          filters.push(`railway='${selectedStationZone}'`);
        }

        if (selectedStationDivision !== "ALL") {
          filters.push(`division='${selectedStationDivision}'`);
        }

        const layerName =
          showTrack && !showStation
            ? "P_SMMS:railway_track_yard_lines"
            : "P_SMMS:railway_station";

        targetUrl =
          `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
          `?service=WFS` +
          `&version=1.0.0` +
          `&request=GetFeature` +
          `&typeName=${layerName}` +
          `&cql_filter=${encodeURIComponent(filters.join(" AND "))}` +
          `&outputFormat=application/json` +
          `&srsName=EPSG:4326`;
      } else {
        return;
      }

      try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        console.log("Zoom Response CRS:", data.crs);
        console.log(
          "First Feature:",
          data.features?.[0]?.geometry?.coordinates,
        );
        if (!data.features || data.features.length === 0) return;

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        const processCoords = ([x, y]: number[]) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        };

        data.features.forEach((f: any) => {
          if (!f.geometry) return;
          if (f.geometry.type === "Point") {
            processCoords(f.geometry.coordinates);
          } else if (
            f.geometry.type === "MultiPoint" ||
            f.geometry.type === "LineString"
          ) {
            f.geometry.coordinates.forEach((coord: any) => {
              if (typeof coord[0] === "number") processCoords(coord);
              else coord.forEach(processCoords);
            });
          } else if (f.geometry.type === "MultiLineString") {
            f.geometry.coordinates.forEach((line: any) => {
              line.forEach(processCoords);
            });
          }
        });

        const extent4326 = [minX, minY, maxX, maxY];

        const extent3857 = transformExtent(
          extent4326,
          "EPSG:4326",
          "EPSG:3857",
        );

        const view = mapInstanceRef.current.getView();

        if (minX === maxX && minY === maxY) {
          const center = fromLonLat([minX, minY]);

          view.animate({
            center,
            zoom: 11,
            duration: 1000,
          });
        } else {
          view.fit(extent3857, {
            padding: [120, 120, 120, 120],
            duration: 1000,
          });
        }
      } catch (err) {
        console.error("Bounding calculations error:", err);
      }
    };

    triggerDynamicZoom();
  }, [
    selectedStationZone,
    selectedStationDivision,
    selectedCommZone,
    selectedCommDivision,
    selectedCommFirm,
  ]);

  const handleResetToHome = () => {
    searchMarkerSourceRef.current.clear();
    setIsMapInitialized(false);
    setShowStation(true);
    setShowTrack(false);
    setSelectedStationZone("ALL");
    setSelectedStationDivision("ALL");
    setSelectedCommZone("ALL");
    setSelectedCommDivision("ALL");
    setSelectedCommFirm("ALL");
    setSearchQuery("");
    setShowZone(false);
    setShowIndiaBoundary(true);

    setSelectedStation(null);
    setPopupData(null);
    setActiveBasemap("OSM");
    overlayRef.current?.setPosition(undefined);

    const resetVisibility: Record<string, boolean> = {};
    SURAKSHA_SUB_LAYERS.forEach((layer) => {
      resetVisibility[layer.id] = false;
    });
    setSubLayerVisibility(resetVisibility);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        duration: 1000,
      });
    }
  };

  const handleClearFilters = () => {
    // Station filters
    setSelectedStationZone("ALL");
    setSelectedStationDivision("ALL");

    // Commissioned station filters
    setSelectedCommZone("ALL");
    setSelectedCommDivision("ALL");
    setSelectedCommFirm("ALL");

    // Turn off all Suraksha layers
    const surakshaReset: Record<string, boolean> = {};
    SURAKSHA_SUB_LAYERS.forEach((layer) => {
      surakshaReset[layer.id] = false;
    });
    setSubLayerVisibility(surakshaReset);

    // Turn off all Signalling layers
    const signallingReset: Record<string, boolean> = {};
    SIGNALLING_SUB_LAYERS.forEach((layer) => {
      signallingReset[layer.id] = false;
    });
    setSignallingLayerVisibility(signallingReset);

    // Reset base layers
    setShowStation(true);
    setShowTrack(false);
    setShowZone(false);
    setShowIndiaBoundary(true);

    // Remove popup
    overlayRef.current?.setPosition(undefined);
    setPopupData(null);

    // Clear search marker
    searchMarkerSourceRef.current.clear();

    // Zoom back to India
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        duration: 1000,
      });
    }
  };

  const handleToggleSubLayer = async (id: string) => {
    if (!isMapInitialized) setIsMapInitialized(true);
    const newValue = !subLayerVisibility[id];
    setSubLayerVisibility((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleSwitchToggle = (
    type: "station" | "track" | "zone" | "indiaBoundary" | "surakshaBoundary",
    checked: boolean,
  ) => {
    if (!isMapInitialized) setIsMapInitialized(true);
    if (type === "station") setShowStation(checked);
    if (type === "track") setShowTrack(checked);
    if (type === "zone") setShowZone(checked);
    if (type === "indiaBoundary") setShowIndiaBoundary(checked);
  };

  const handleSearchAndPan = async (stationCode?: string) => {
    const searchValue = stationCode || searchQuery;
    if (!searchValue.trim() || !mapInstanceRef.current) return;

    const typeName = "P_SMMS:railway_station";
    const cqlFilter = `sttncode ILIKE '${searchValue}%' OR sttnname ILIKE '%${searchValue}%'`;
    const url =
      `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wfs` +
      `?service=WFS` +
      `&version=1.0.0` +
      `&request=GetFeature` +
      `&typeName=${encodeURIComponent(typeName)}` +
      `&cql_filter=${encodeURIComponent(cqlFilter)}` +
      `&outputFormat=application/json` +
      `&srsName=EPSG:4326`;
    try {
      const response = await fetch(url);
      const geoJson = await response.json();
      if (!geoJson.features || geoJson.features.length === 0) {
        alert("No station found");
        return;
      }

      const feature = geoJson.features[0];
      if (!feature?.geometry) return;

      setIsMapInitialized(true);
      setShowStation(true);

      const view = mapInstanceRef.current.getView();
      if (feature.geometry.type === "Point") {
        const [lon, lat] = feature.geometry.coordinates;
        searchMarkerSourceRef.current.clear();
        searchMarkerSourceRef.current.addFeature(
          new Feature({
            geometry: new Point(fromLonLat([lon, lat])),
          }),
        );
        view.animate({
          center: fromLonLat([lon, lat]),
          zoom: 14,
          duration: 1200,
        });
      }
    } catch (error) {
      console.error("WFS Search failure:", error);
    }
  };


  const fetchWeather = async () => {
    

   try{

      const res = await axios.get(
          "https://api.imd.gov.in/api/v1/stationnowcast"
      );
             console.log(res.data);

      setWeatherData(res.data);

   }catch(err){

      console.log(err);

   }

}


  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 170px)",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#f4f6f9",
      }}
    >
      {/* SEARCH BAR PANEL */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          top: 5,
          left: 40,
          zIndex: 15,
          p: "6px 12px",
          display: "flex",
          alignItems: "center",
          borderRadius: "30px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          boxShadow: "0 4px 25px rgba(0,0,0,0.1)",
        }}
      >
        <Tooltip title="Reset Map State" arrow>
          <IconButton
            onClick={handleResetToHome}
            sx={{
              bgcolor: "#2f5dd7",
              color: "#fff",
              "&:hover": { bgcolor: "#1f44a9" },
              width: 32,
              height: 32,
            }}
          >
            <HomeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
        <Autocomplete
          value={selectedStation}
          freeSolo
          options={stationOptions}
          sx={{ width: 280 }}
          getOptionLabel={(option) =>
            typeof option === "string"
              ? option
              : `${option.code} - ${option.name}`
          }
          onInputChange={(_, value) => setSearchQuery(value)}
          onChange={(_, value) => {
            setSelectedStation(value);
            if (value && typeof value !== "string") {
              setSearchQuery(value.code);
              handleSearchAndPan(value.code);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search Station"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchAndPan();
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: "text.secondary", fontSize: 18 }}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          variant="contained"
          onClick={() => handleSearchAndPan()}
          sx={{
            height: 28,
            borderRadius: "20px",
            bgcolor: "#111",
            color: "#fff",
            textTransform: "none",
            fontSize: "12px",
            fontWeight: 600,
            px: 2.5,
            boxShadow: "none",
            "&:hover": { bgcolor: "#333", boxShadow: "none" },
          }}
        >
          Find
        </Button>
      </Paper>

      {/* FIXED ASSET LAYER ACTION TRIGGER TRIGGER */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          top: 5,
          right: 15,
          zIndex: 15,
          p: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderRadius: "30px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
        }}
      >
        <Tooltip title="Documents" arrow>
          <Button
            variant="text"
            size="small"
            startIcon={
              <UploadFileIcon sx={{ color: "#2f5dd7", fontSize: 18 }} />
            }
            endIcon={
              <KeyboardArrowDownIcon sx={{ opacity: 0.7, fontSize: 14 }} />
            }
            onClick={() => setShowDocumentPanel(!showDocumentPanel)}
            sx={{
              borderRadius: "20px",
              height: 32,
              fontSize: "13px",
              px: 1.5,
              textTransform: "none",
              fontWeight: 600,
              color: "#333",
            }}
          ></Button>
        </Tooltip>

        <Tooltip title="Assets & Filters" arrow>
          <Button
            variant="text"
            size="small"
            startIcon={<LayersIcon sx={{ color: "#2f5dd7", fontSize: 18 }} />}
            endIcon={
              <KeyboardArrowDownIcon sx={{ opacity: 0.7, fontSize: 14 }} />
            }
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            sx={{
              borderRadius: "20px",
              height: 32,
              fontSize: "13px",
              px: 1.5,
              textTransform: "none",
              fontWeight: 600,
              color: "#333",
            }}
          ></Button>
        </Tooltip>

        <Tooltip title="Basemap Layers" arrow>
          <Button
            variant="text"
            size="small"
            startIcon={<MapIcon sx={{ color: "#2f5dd7", fontSize: 18 }} />}
            endIcon={
              <KeyboardArrowDownIcon sx={{ opacity: 0.7, fontSize: 14 }} />
            }
            onClick={() => setShowBasemapPanel(!showBasemapPanel)}
            sx={{
              borderRadius: "20px",
              height: 32,
              fontSize: "13px",
              px: 1.5,
              textTransform: "none",
              fontWeight: 600,
              color: "#333",
            }}
          ></Button>
        </Tooltip>

        {/* COMBINED LAYER LIST AND BOTTOM FILTER SPECIFICATION PANEL */}
        {showLayersPanel && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: 55,
              right: 0,
              zIndex: 20,
              width: 330,
              maxHeight: "75vh",
              overflowY: "auto",
              p: 2,
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 1,
  }}
>
  <Typography
    variant="subtitle2"
    sx={{ fontWeight: 700, color: "#2f5dd7" }}
  >
    GIS Reference Layers
  </Typography>

  <Box sx={{ display: "flex", gap: 1 }}>
 <Tooltip title="Clear Filters" arrow>
  <IconButton
    size="small"
    color="error"
    onClick={handleClearFilters}
    sx={{
      bgcolor: "#fee2e2",
      "&:hover": {
        bgcolor: "#fecaca",
      },
    }}
  >
    <RestartAltIcon fontSize="small" />
  </IconButton>
</Tooltip>

    <IconButton
      size="small"
      onClick={() => setShowLayersPanel(false)}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
</Box>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showStation}
                    onChange={(e) =>
                      handleSwitchToggle("station", e.target.checked)
                    }
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                    Railway Stations
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showTrack}
                    onChange={(e) =>
                      handleSwitchToggle("track", e.target.checked)
                    }
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                    Track / Yard Lines
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showZone}
                    onChange={(e) =>
                      handleSwitchToggle("zone", e.target.checked)
                    }
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                    Railway Zones
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showIndiaBoundary}
                    onChange={(e) =>
                      handleSwitchToggle("indiaBoundary", e.target.checked)
                    }
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                    India Boundary
                  </Typography>
                }
              />
            </Box>

            {/* INTEGRATED CONDITIONAL LAYERS FILTERS AT THE BOTTOM */}
            {(showStation ||
              subLayerVisibility.suraksha_comissioned_stations) && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    color: "#333",
                    fontSize: "13px",
                  }}
                >
                  Reference Layer Filter
                </Typography>

                {/* 1. Railway Station Segment Dropdowns */}
                {(showStation || showTrack) && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#2f5dd7"
                      display="block"
                      sx={{ mb: 1.5, textTransform: "uppercase" }}
                    >
                      Zone / Division Filters
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                      <InputLabel>Station Zone</InputLabel>
                      <Select
                        value={selectedStationZone}
                        label="Station Zone"
                        onChange={(e) => {
                          setSelectedStationZone(e.target.value);
                          setSelectedStationDivision("ALL");
                        }}
                      >
                        <MenuItem value="ALL">
                          <em>All Zones</em>
                        </MenuItem>
                        {stationZones.map((z) => (
                          <MenuItem key={z} value={z}>
                            {z}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Station Division</InputLabel>
                      <Select
                        value={selectedStationDivision}
                        label="Station Division"
                        onChange={(e) =>
                          setSelectedStationDivision(e.target.value)
                        }
                      >
                        <MenuItem value="ALL">
                          <em>All Divisions</em>
                        </MenuItem>
                        {stationDivisions.map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* 2. Commissioned Station Segment Dropdowns */}
                {subLayerVisibility.suraksha_comissioned_stations && (
                  <Box
                    sx={{
                      p: 1.5,
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      bgcolor: "#f0fdf4",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#16a34a"
                      display="block"
                      sx={{ mb: 1.5, textTransform: "uppercase" }}
                    >
                      Commissioned Station Filters
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                      <InputLabel>Zone</InputLabel>
                      <Select
                        value={selectedCommZone}
                        label="Zone"
                        onChange={(e) => {
                          setSelectedCommZone(e.target.value);
                          setSelectedCommDivision("ALL");
                        }}
                      >
                        <MenuItem value="ALL">
                          <em>All Zones</em>
                        </MenuItem>
                        {commissionedZones.map((z) => (
                          <MenuItem key={z} value={z}>
                            {z}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                      <InputLabel>Division</InputLabel>
                      <Select
                        value={selectedCommDivision}
                        label="Division"
                        onChange={(e) =>
                          setSelectedCommDivision(e.target.value)
                        }
                      >
                        <MenuItem value="ALL">
                          <em>All Divisions</em>
                        </MenuItem>
                        {commissionedDivisions.map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Firm</InputLabel>
                      <Select
                        value={selectedCommFirm}
                        label="Firm"
                        onChange={(e) => setSelectedCommFirm(e.target.value)}
                      >
                        <MenuItem value="ALL">
                          <em>All Firms</em>
                        </MenuItem>
                        {commissionedFirms.map((f) => (
                          <MenuItem key={f} value={f}>
                            {f}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </>
            )}

            <Divider sx={{ mb: 1.5 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={SURAKSHA_SUB_LAYERS.every(
                    (layer) => subLayerVisibility[layer.id],
                  )}
                  indeterminate={
                    SURAKSHA_SUB_LAYERS.some(
                      (layer) => subLayerVisibility[layer.id],
                    ) &&
                    !SURAKSHA_SUB_LAYERS.every(
                      (layer) => subLayerVisibility[layer.id],
                    )
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;

                    const updates: Record<string, boolean> = {};

                    SURAKSHA_SUB_LAYERS.forEach((layer) => {
                      updates[layer.id] = checked;
                    });

                    setSubLayerVisibility(updates);

                    if (checked) {
                      setIsMapInitialized(true);
                    }
                  }}
                />
              }
              label={
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#555",
                  }}
                >
                  Suraksha Assets
                </Typography>
              }
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.2,
                maxHeight: 160,
                overflowY: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
                p: 1,
                bgcolor: "#fafafa",
                mb: 2,
              }}
            >
              {SURAKSHA_SUB_LAYERS.map((layer) => (
                <FormControlLabel
                  key={layer.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!subLayerVisibility[layer.id]}
                      onChange={() => handleToggleSubLayer(layer.id)}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "12px", color: "#444" }}>
                      {layer.label}
                    </Typography>
                  }
                />
              ))}
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <FormControlLabel
              control={
                <Checkbox
                  checked={SIGNALLING_SUB_LAYERS.every(
                    (layer) => signallingLayerVisibility[layer.id],
                  )}
                  indeterminate={
                    SIGNALLING_SUB_LAYERS.some(
                      (layer) => signallingLayerVisibility[layer.id],
                    ) &&
                    !SIGNALLING_SUB_LAYERS.every(
                      (layer) => signallingLayerVisibility[layer.id],
                    )
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;

                    const updates: Record<string, boolean> = {};

                    SIGNALLING_SUB_LAYERS.forEach((layer) => {
                      updates[layer.id] = checked;
                    });

                    setSignallingLayerVisibility(updates);

                    if (checked) {
                      setIsMapInitialized(true);
                    }
                  }}
                />
              }
              label={
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#555",
                  }}
                >
                  Signalling Assets
                </Typography>
              }
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                pl: 1,
                py: 1,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {SIGNALLING_CATEGORIES.map((category) => (
                <Box key={category.id} sx={{ mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "#2f5dd7",
                      mb: 0.5,
                    }}
                  >
                    {category.label}
                  </Typography>

                  <Box sx={{ pl: 2 }}>
                    {category.layers.map((layer) => (
                      <FormControlLabel
                        key={layer.id}
                        sx={{
                          display: "flex",
                          width: "100%",
                          margin: 0,
                          mb: 0.5,
                        }}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!signallingLayerVisibility[layer.id]}
                            onChange={() =>
                              setSignallingLayerVisibility((prev) => ({
                                ...prev,
                                [layer.id]: !prev[layer.id],
                              }))
                            }
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "12px",
                              color: "#444",
                            }}
                          >
                            {layer.label}
                          </Typography>
                        }
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          
          </Paper>
        )}
      </Paper>

      {/* FIXED BASEMAP PANEL */}
      {showBasemapPanel && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: 55,
            right: 0,
            zIndex: 20,
            width: 250,
            p: 2,
            borderRadius: "16px",
            backgroundColor: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "#2f5dd7",
              }}
            >
              Basemap Selection
            </Typography>

            <IconButton size="small" onClick={() => setShowBasemapPanel(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Button
              fullWidth
              variant={activeBasemap === "OSM" ? "contained" : "outlined"}
              startIcon={<PublicIcon />}
              onClick={() => setActiveBasemap("OSM")}
            >
              OpenStreetMap
            </Button>

            <Button
              fullWidth
              variant={
                activeBasemap === "BHUVAN_MAP" ? "contained" : "outlined"
              }
              startIcon={<MapIcon />}
              onClick={() => setActiveBasemap("BHUVAN_MAP")}
            >
              Bhuvan Map
            </Button>

            <Button
              fullWidth
              variant={
                activeBasemap === "GOOGLE_SATELLITE" ? "contained" : "outlined"
              }
              startIcon={<SatelliteIcon />}
              onClick={() => setActiveBasemap("GOOGLE_SATELLITE")}
            >
              Google Satellite
            </Button>
          </Box>
        </Paper>
      )}
      {showDocumentPanel && (
  <Paper
    elevation={8}
    sx={{
      position: "absolute",
      top: 55,
      right: 0,
      zIndex: 20,
      width: 300,
      minHeight: 250,
      p: 2,
      borderRadius: "16px",
      backgroundColor: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color: "#2f5dd7",
        }}
      >
        Documents
      </Typography>

      <IconButton
        size="small"
        onClick={() => setShowDocumentPanel(false)}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>

    {/* Empty Panel */}
    <Box
      sx={{
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed #d1d5db",
        borderRadius: "12px",
        bgcolor: "#fafafa",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        No Documents Available
      </Typography>
    </Box>
  </Paper>
)}

      {/* ZOOM STATUS */}
      <Paper
        elevation={2}
        sx={{
          position: "absolute",
          bottom: 1,
          left: 1,
          zIndex: 15,
          px: 2,
          py: 0.5,
          borderRadius: "20px",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "#fff",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, letterSpacing: "0.5px" }}
        >
          ZOOM LEVEL: {currentZoom}
        </Typography>
      </Paper>

      {/* MAP MOUNT CONTAINER */}
      <Box
        ref={mapRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />

      {/* INFO POPUP ELEMENT */}
      <Box
        ref={popupRef}
        sx={{
          position: "absolute",
          zIndex: 25,
          transform: "translate(-50%, -100%)",
          mt: -2,
        }}
      >
        {(isPopupLoading || popupData) && (
          <Paper
            elevation={16}
            sx={{
              p: 0,
              borderRadius: "16px",
              minWidth: 310,
              maxWidth: 360,
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px) saturate(160%)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  maxWidth: "80%",
                }}
              >
                <LayersIcon
                  sx={{ color: "#00ecff", fontSize: 18, flexShrink: 0 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {isPopupLoading
                    ? "Fetching Details..."
                    : popupData?.attributes?.station_name ||
                      popupData?.attributes?.asset_name ||
                      popupData?.attributes?.name ||
                      popupData?.layerName?.toUpperCase() ||
                      "Asset Information"}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => overlayRef.current?.setPosition(undefined)}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": { color: "#fff" },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {isPopupLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 4,
                  gap: 2,
                }}
              >
                <CircularProgress
                  size={20}
                  thickness={5}
                  sx={{ color: "#2f5dd7" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontWeight: 500 }}
                >
                  Connecting GeoServer...
                </Typography>
              </Box>
            ) : (
              popupData && (
                <Box sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#555",
                        fontWeight: 800,
                        fontSize: "10.5px",
                      }}
                    >
                      Asset Details
                    </Typography>
                    <Chip
                      label={popupData.layerName.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: "rgba(47,93,215,0.1)",
                        color: "#2f5dd7",
                        fontWeight: 700,
                        fontSize: "10px",
                        borderRadius: "6px",
                      }}
                    />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <List
                    disablePadding
                    sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}
                  >
                    <Grid container spacing={1}>
                      {popupData.displayFields.map((field) => {
                        const val = popupData.attributes[field];
                        if (val === null || val === undefined) return null;
                        return (
                          <React.Fragment key={field}>
                            <Grid
                              size={5}
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  color: "#718096",
                                  textTransform: "capitalize",
                                }}
                              >
                                {field.replace(/_/g, " ")}
                              </Typography>
                            </Grid>
                            <Grid size={7}>
                              <Box
                                sx={{
                                  bgcolor: "#f7fafc",
                                  p: 0.6,
                                  borderRadius: "6px",
                                  border: "1px solid #edf2f7",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#1a202c",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {String(val)}
                                </Typography>
                              </Box>
                            </Grid>
                          </React.Fragment>
                        );
                      })}
                    </Grid>
                  </List>
                </Box>
              )
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default GisMapPage;
