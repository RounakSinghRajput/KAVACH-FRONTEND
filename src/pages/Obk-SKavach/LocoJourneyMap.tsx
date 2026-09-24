import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  TrainFront,
  Play,
  RotateCcw,
  MapPin,
  AlertTriangle,
} from "lucide-react";

// OpenLayers Imports
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import MultiLineString from "ol/geom/MultiLineString";
import Geometry from "ol/geom/Geometry";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Circle as CircleStyle, Fill, Icon } from "ol/style";

import { axiosInstance } from "../../services/axios";

// SVG Assets
const TRAIN_FRONT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="30" height="30"><circle cx="50" cy="50" r="42" fill="%2322c55e" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="48" fill="none" stroke="%2322c55e" stroke-width="2" stroke-dasharray="4,2"/><g transform="translate(26, 26) scale(2)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></g></svg>`;

const EVENT_WARNING_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23f59e0b" stroke="white" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

interface StationPoint {
  cavLocoNumb: string;
  cavTrainNumb: string;
  cavTrainName: string;
  cadTrainDate: string;
  cavStnCode: string;
  cadSchldTime: string;
  cadArvldPrtTime: string | null;
  cavOrigSttn: string;
  cavDstnSttn: string;
  cadPttDprtTime: string | null;
  cadPttArvlTime: string | null;
  cavDrtn: string;
  updatedDate: string;
}

interface EnrichedStation extends StationPoint {
  lon: number;
  lat: number;
  segmentGeometry?: Geometry | null;
  segmentLength?: number;
}

interface SegmentEvent {
  eventType: string;
  eventTime: string;
  nmsStationCode: string;
  coaStationCode: string;
  inKavachSection: boolean;
}

interface Segment {
  fromStationCode: string;
  fromStationKavach: boolean;
  toStationCode: string;
  toStationKavach: boolean;
  fromTime: string;
  toTime: string;
  connectivityStatus: "CONNECTED" | "DISCONNECTED";
  connectedDuration: string;
  disconnectedDuration: string;
  eventCount: number;
  kavachSegment: boolean;
  events: SegmentEvent[];
}

const CONNECTION_TOLERANCE = 100;

const getSegmentStyles = (segment?: Segment) => {
  const isKavach = segment?.kavachSegment ?? false;
  const isDisconnected = segment?.connectivityStatus === "DISCONNECTED";

  const baseTrackColor = isKavach ? "#22c55e" : "#ef4444";

  const styles: Style[] = [];

  // 1. Base Track Solid Stroke
  styles.push(
    new Style({
      stroke: new Stroke({
        color: baseTrackColor,
        width: 6,
        lineCap: "round",
      }),
    }),
  );

  // 2. Disconnected overlay in Kavach section
  if (isKavach && isDisconnected) {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: "#f59e0b", // Amber Warning Dash
          width: 6,
          lineCap: "round",
          lineDash: [10, 10],
        }),
      }),
    );
  } else {
    // Normal Track Ties
    styles.push(
      new Style({
        stroke: new Stroke({
          color: "#ffffff",
          width: 2,
          lineDash: [4, 6],
        }),
      }),
    );
  }

  return styles;
};

export default function LocoJourneyMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryLocoNo = searchParams.get("locoNo");
  const queryDate = searchParams.get("date");

  const [summary, setSummary] = useState<any>(null);
  const [locoNo, setLocoNo] = useState<string>(queryLocoNo || "30001");
  const [selectedDate, setSelectedDate] = useState<string>(
    queryDate || new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stationSequence, setStationSequence] = useState<StationPoint[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);

  const [enrichedStations, setEnrichedStations] = useState<EnrichedStation[]>(
    [],
  );
  const [currentStationIdx, setCurrentStationIdx] = useState<number>(0);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const routeSourceRef = useRef(new VectorSource());
  const stationSourceRef = useRef(new VectorSource());
  const trainSourceRef = useRef(new VectorSource());

  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const stationCache = useRef<Record<string, { lon: number; lat: number }>>({});
  const trackCache = useRef<Record<string, Geometry | null>>({});

  const animationRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const trainMarkerRef = useRef<Feature | null>(null);

  const animationRunningRef = useRef<boolean>(false);
  const animationPausedRef = useRef<boolean>(false);
  const currentSegmentRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);

  const stationCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const footerScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const footerTimelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (stationCardRefs.current[currentStationIdx]) {
      stationCardRefs.current[currentStationIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentStationIdx]);

  useEffect(() => {
    if (footerScrollContainerRef.current && footerTimelineRef.current) {
      const container = footerScrollContainerRef.current;
      const timelineWidth = footerTimelineRef.current.scrollWidth;
      const containerWidth = container.clientWidth;

      if (timelineWidth > containerWidth) {
        const scrollableDist = timelineWidth - containerWidth;
        const targetScrollLeft = (animationProgress / 100) * scrollableDist;

        container.scrollTo({
          left: targetScrollLeft,
          behavior: isAnimating ? "auto" : "smooth",
        });
      }
    }
  }, [animationProgress, isAnimating]);

  const updateStationStyles = (currentIdx: number) => {
    stationSourceRef.current.getFeatures().forEach((feat, idx) => {
      const color =
        idx < currentIdx
          ? "#22c55e"
          : idx === currentIdx
            ? "#2563eb"
            : "#cbd5e1";

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color }),
            stroke: new Stroke({
              color: "#ffffff",
              width: 2,
            }),
          }),
        }),
      );
    });
  };

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    animationRunningRef.current = false;
    animationPausedRef.current = false;

    currentSegmentRef.current = 0;
    currentProgressRef.current = 0;

    setIsAnimating(false);
    setIsPaused(false);
    setAnimationProgress(0);
  };

  const pauseAnimation = () => {
    if (!animationRunningRef.current) return;

    animationPausedRef.current = true;
    setIsPaused(true);

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    setIsAnimating(false);
  };

  const resumeAnimation = () => {
    if (!trainMarkerRef.current || enrichedStations.length < 2) return;

    animationPausedRef.current = false;
    setIsPaused(false);

    animationRunningRef.current = true;
    setIsAnimating(true);

    animateTrain(enrichedStations, true);
  };

  const animateTrain = (stations: EnrichedStation[], resume = false) => {
    if (!trainMarkerRef.current || stations.length < 2) {
      return;
    }

    if (!resume) {
      stopAnimation();

      currentSegmentRef.current = 0;
      currentProgressRef.current = 0;
    }

    animationRunningRef.current = true;
    animationPausedRef.current = false;

    setIsAnimating(true);
    setIsPaused(false);

    const totalSegments = stations.length - 1;

    const segmentLengths: number[] = [];
    for (let i = 0; i < totalSegments; i++) {
      const geom = stations[i].segmentGeometry;
      if (geom && geom instanceof LineString) {
        segmentLengths.push(geom.getLength());
      } else {
        segmentLengths.push(0);
      }
    }

    const totalJourneyDistance = segmentLengths.reduce(
      (sum, len) => sum + len,
      0,
    );

    const animateNextSegment = () => {
      if (!animationRunningRef.current) {
        return;
      }

      const currentSegIdx = currentSegmentRef.current;

      if (currentSegIdx >= totalSegments) {
        animationRunningRef.current = false;

        setIsAnimating(false);
        setIsPaused(false);
        setAnimationProgress(100);

        return;
      }

      const stnA = stations[currentSegIdx];
      const trackGeom = stnA.segmentGeometry;

      if (!trackGeom || !(trackGeom instanceof LineString)) {
        currentSegmentRef.current = currentSegIdx + 1;
        currentProgressRef.current = 0;

        setCurrentStationIdx(currentSegmentRef.current);
        updateStationStyles(currentSegmentRef.current);

        animationTimeoutRef.current = setTimeout(() => {
          animationTimeoutRef.current = null;

          if (animationRunningRef.current) {
            animateNextSegment();
          }
        }, 300);

        return;
      }

      const coordinates = trackGeom.getCoordinates();

      if (coordinates.length < 2) {
        currentSegmentRef.current = currentSegIdx + 1;
        currentProgressRef.current = 0;

        animationTimeoutRef.current = setTimeout(() => {
          animationTimeoutRef.current = null;

          if (animationRunningRef.current) {
            animateNextSegment();
          }
        }, 300);

        return;
      }

      const distances: number[] = [];
      let totalDistance = 0;
      distances.push(0);

      for (let i = 1; i < coordinates.length; i++) {
        const dx = coordinates[i][0] - coordinates[i - 1][0];
        const dy = coordinates[i][1] - coordinates[i - 1][1];
        const segmentDistance = Math.sqrt(dx * dx + dy * dy);

        totalDistance += segmentDistance;
        distances.push(totalDistance);
      }

      if (totalDistance <= 0) {
        return;
      }

      const duration = 6000;
      const initialProgress = currentProgressRef.current;
      const startTime = performance.now() - initialProgress * duration;

      const completedDistance = segmentLengths
        .slice(0, currentSegIdx)
        .reduce((sum, d) => sum + d, 0);

      const step = (now: number) => {
        if (!animationRunningRef.current || animationPausedRef.current) {
          return;
        }

        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        currentProgressRef.current = progress;

        const currentDistance = completedDistance + totalDistance * progress;
        const overallPercent =
          totalJourneyDistance > 0
            ? (currentDistance / totalJourneyDistance) * 100
            : ((currentSegIdx + progress) / totalSegments) * 100;

        setAnimationProgress(overallPercent);

        const targetDistance = progress * totalDistance;
        let segmentIndex = 0;

        for (let i = 1; i < distances.length; i++) {
          if (distances[i] >= targetDistance) {
            segmentIndex = i - 1;
            break;
          }
          segmentIndex = i - 1;
        }

        const segmentStart = coordinates[segmentIndex];
        const segmentEnd = coordinates[segmentIndex + 1];

        const segmentStartDistance = distances[segmentIndex];
        const segmentEndDistance = distances[segmentIndex + 1];

        const segmentLength = segmentEndDistance - segmentStartDistance;

        const localProgress =
          segmentLength > 0
            ? (targetDistance - segmentStartDistance) / segmentLength
            : 0;

        const currentCoord = [
          segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * localProgress,
          segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * localProgress,
        ];

        const dx = segmentEnd[0] - segmentStart[0];
        const dy = segmentEnd[1] - segmentStart[1];
        const rotationAngle = Math.atan2(dy, dx);

        const trainGeom = trainMarkerRef.current?.getGeometry() as Point;
        if (trainGeom) {
          trainGeom.setCoordinates(currentCoord);
        }

        if (mapRef.current) {
          mapRef.current.getView().setCenter(currentCoord);
        }

        trainMarkerRef.current?.setStyle(
          new Style({
            image: new Icon({
              src: TRAIN_FRONT_SVG,
              width: 32,
              height: 32,
              anchor: [0.5, 0.5],
              rotation: -rotationAngle,
            }),
          }),
        );

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
          return;
        }

        currentSegmentRef.current = currentSegIdx + 1;
        currentProgressRef.current = 0;

        setCurrentStationIdx(currentSegmentRef.current);
        updateStationStyles(currentSegmentRef.current);

        animationTimeoutRef.current = setTimeout(() => {
          animationTimeoutRef.current = null;

          if (animationRunningRef.current) {
            animateNextSegment();
          }
        }, 1000);
      };

      animationRef.current = requestAnimationFrame(step);
    };

    animateNextSegment();
  };

  const resetAnimation = () => {
    stopAnimation();
    if (enrichedStations[0] && trainMarkerRef.current) {
      const first = enrichedStations[0];
      const point = trainMarkerRef.current.getGeometry() as Point;
      point.setCoordinates(fromLonLat([first.lon, first.lat]));
      setCurrentStationIdx(0);
      updateStationStyles(0);
      setAnimationProgress(0);
      if (mapRef.current) {
        mapRef.current.getView().animate({
          center: fromLonLat([first.lon, first.lat]),
          zoom: 10,
          duration: 500,
        });
      }
    }
  };

  const handleSearch = async (
    targetLoco: string = locoNo,
    targetDate: string = selectedDate,
  ) => {
    if (!targetLoco || !targetDate) return;

    stopAnimation();
    setLoading(true);
    setError(null);
    setCurrentStationIdx(0);

    const fromIso = `${targetDate}T00:00:00`;
    const toIso = `${targetDate}T23:59:59`;

    const endpoint = `/locoConnectivityLog/getCoAMovementWithNMSEvent/${targetLoco}?from=${fromIso}&to=${toIso}`;

    try {
      const response = await axiosInstance.get(endpoint);

      const rawList: StationPoint[] =
        response.data?.data?.stationSequence || [];
      const apiSegments: Segment[] = response.data?.data?.segments || [];

      if (!rawList.length) {
        setError("No journey data found for the selected Locomotive and Date.");
        setStationSequence([]);
        setSegments([]);
        clearMapLayers();
        return;
      }

      setStationSequence(rawList);
      setSegments(apiSegments);
      setSummary(response.data.data);

      await executeSequentialFlow(rawList, apiSegments);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch journey data.");
    } finally {
      setLoading(false);
    }
  };

  const clearMapLayers = () => {
    routeSourceRef.current.clear();
    stationSourceRef.current.clear();
    trainSourceRef.current.clear();
    trainMarkerRef.current = null;
  };

  const getStationCoordinate = async (stationCode: string) => {
    if (stationCache.current[stationCode]) {
      return stationCache.current[stationCode];
    }

    const url =
      `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
      `?service=WFS&version=1.0.0&request=GetFeature` +
      `&typeName=P_SMMS:railway_station` +
      `&CQL_FILTER=${encodeURIComponent(`sttncode='${stationCode}'`)}` +
      `&outputFormat=application/json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || !data.features.length) return null;

      const feature = data.features[0];
      const [lon, lat] =
        feature.geometry.type === "Point"
          ? feature.geometry.coordinates
          : feature.geometry.coordinates[0];

      const coords = { lon, lat };
      stationCache.current[stationCode] = coords;
      return coords;
    } catch {
      return null;
    }
  };

  const fetchSegmentTrackGeometry = async (
    fromStn: EnrichedStation,
    toStn: EnrichedStation,
  ): Promise<Geometry | null> => {
    const cacheKey = `${fromStn.cavStnCode}_${toStn.cavStnCode}`;

    if (trackCache.current[cacheKey]) {
      return trackCache.current[cacheKey]!;
    }

    const minLon = Math.min(fromStn.lon, toStn.lon) - 0.05;
    const minLat = Math.min(fromStn.lat, toStn.lat) - 0.05;
    const maxLon = Math.max(fromStn.lon, toStn.lon) + 0.05;
    const maxLat = Math.max(fromStn.lat, toStn.lat) + 0.05;

    const bboxFilter = `BBOX(geom, ${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 'EPSG:4326')`;

    const url =
      `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
      `?service=WFS&version=1.0.0&request=GetFeature` +
      `&typeName=P_SMMS:railway_track_yard_lines` +
      `&CQL_FILTER=${encodeURIComponent(bboxFilter)}` +
      `&outputFormat=application/json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data?.features?.length) return null;

      const geojsonFormat = new GeoJSON();
      const features = geojsonFormat.readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      if (!features.length) return null;

      const lines: LineString[] = [];

      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry instanceof LineString) {
          lines.push(geometry);
        } else if (geometry instanceof MultiLineString) {
          lines.push(...geometry.getLineStrings());
        }
      });

      if (!lines.length) return null;

      const startPoint = fromLonLat([fromStn.lon, fromStn.lat]);
      const endPoint = fromLonLat([toStn.lon, toStn.lat]);

      const distance = (a: number[], b: number[]): number => {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return Math.sqrt(dx * dx + dy * dy);
      };

      const pointToSegmentDistance = (
        p: number[],
        a: number[],
        b: number[],
      ): number => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];

        if (dx === 0 && dy === 0) {
          return distance(p, a);
        }

        const t = Math.max(
          0,
          Math.min(
            1,
            ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy),
          ),
        );

        const projection = [a[0] + t * dx, a[1] + t * dy];

        return distance(p, projection);
      };

      const lineToLineDistance = (
        lineA: LineString,
        lineB: LineString,
      ): number => {
        const coordsA = lineA.getCoordinates();
        const coordsB = lineB.getCoordinates();

        let minDistance = Infinity;

        for (let i = 0; i < coordsA.length - 1; i++) {
          const a1 = coordsA[i];
          const a2 = coordsA[i + 1];

          for (let j = 0; j < coordsB.length - 1; j++) {
            const b1 = coordsB[j];
            const b2 = coordsB[j + 1];

            const d1 = pointToSegmentDistance(a1, b1, b2);
            const d2 = pointToSegmentDistance(a2, b1, b2);
            const d3 = pointToSegmentDistance(b1, a1, a2);
            const d4 = pointToSegmentDistance(b2, a1, a2);

            minDistance = Math.min(minDistance, d1, d2, d3, d4);

            if (minDistance <= CONNECTION_TOLERANCE) {
              return minDistance;
            }
          }
        }

        return minDistance;
      };

      const startLineIndices: number[] = [];

      lines.forEach((line, index) => {
        const coords = line.getCoordinates();
        if (!coords.length) return;

        for (let i = 0; i < coords.length - 1; i++) {
          const d = pointToSegmentDistance(
            startPoint,
            coords[i],
            coords[i + 1],
          );

          if (d <= CONNECTION_TOLERANCE) {
            startLineIndices.push(index);
            break;
          }
        }
      });

      if (!startLineIndices.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        lines.forEach((line, index) => {
          const coords = line.getCoordinates();
          if (!coords.length) return;

          for (let i = 0; i < coords.length - 1; i++) {
            const d = pointToSegmentDistance(
              startPoint,
              coords[i],
              coords[i + 1],
            );

            if (d < nearestDistance) {
              nearestDistance = d;
              nearestIndex = index;
            }
          }
        });

        if (nearestIndex >= 0) {
          startLineIndices.push(nearestIndex);
        }
      }

      if (!startLineIndices.length) return null;

      let destinationLineIndices: number[] = [];
      lines.forEach((line, index) => {
        const coords = line.getCoordinates();
        if (!coords.length) return;

        for (let i = 0; i < coords.length - 1; i++) {
          const d = pointToSegmentDistance(endPoint, coords[i], coords[i + 1]);

          if (d <= CONNECTION_TOLERANCE) {
            destinationLineIndices.push(index);
            break;
          }
        }
      });

      if (!destinationLineIndices.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        lines.forEach((line, index) => {
          const coords = line.getCoordinates();
          if (!coords.length) return;

          for (let i = 0; i < coords.length - 1; i++) {
            const d = pointToSegmentDistance(
              endPoint,
              coords[i],
              coords[i + 1],
            );

            if (d < nearestDistance) {
              nearestDistance = d;
              nearestIndex = index;
            }
          }
        });

        if (nearestIndex >= 0) {
          destinationLineIndices.push(nearestIndex);
        }
      }

      if (!destinationLineIndices.length) return null;

      const queue: number[][] = [];
      const visited = new Set<number>();

      startLineIndices.forEach((index) => {
        queue.push([index]);
        visited.add(index);
      });

      let foundPath: number[] | null = null;

      while (queue.length > 0) {
        const currentPath = queue.shift()!;
        const currentIndex = currentPath[currentPath.length - 1];

        if (destinationLineIndices.includes(currentIndex)) {
          foundPath = currentPath;
          break;
        }

        const currentLine = lines[currentIndex];
        const currentCoords = currentLine.getCoordinates();

        if (!currentCoords.length) continue;

        const currentStart = currentCoords[0];
        const currentEnd = currentCoords[currentCoords.length - 1];

        lines.forEach((nextLine, nextIndex) => {
          if (visited.has(nextIndex)) return;

          const nextCoords = nextLine.getCoordinates();
          if (!nextCoords.length) return;

          const nextStart = nextCoords[0];
          const nextEnd = nextCoords[nextCoords.length - 1];

          const endpointConnected =
            distance(currentStart, nextStart) <= CONNECTION_TOLERANCE ||
            distance(currentStart, nextEnd) <= CONNECTION_TOLERANCE ||
            distance(currentEnd, nextStart) <= CONNECTION_TOLERANCE ||
            distance(currentEnd, nextEnd) <= CONNECTION_TOLERANCE;

          const geometryConnected =
            lineToLineDistance(currentLine, nextLine) <= CONNECTION_TOLERANCE;

          const connected = endpointConnected || geometryConnected;

          if (connected) {
            visited.add(nextIndex);
            queue.push([...currentPath, nextIndex]);
          }
        });
      }

      if (!foundPath) return null;

      const orderedCoordinates: number[][] = [];
      let currentEndPoint: number[] | null = null;

      foundPath.forEach((lineIndex, pathPosition) => {
        const coords = lines[lineIndex].getCoordinates();
        if (!coords.length) return;

        if (pathPosition === 0) {
          const dStart = distance(startPoint, coords[0]);
          const dEnd = distance(startPoint, coords[coords.length - 1]);

          if (dStart <= dEnd) {
            orderedCoordinates.push(...coords);
            currentEndPoint = coords[coords.length - 1];
          } else {
            const reversed = [...coords].reverse();
            orderedCoordinates.push(...reversed);
            currentEndPoint = reversed[reversed.length - 1];
          }
          return;
        }

        const dToStart = distance(currentEndPoint!, coords[0]);
        const dToEnd = distance(currentEndPoint!, coords[coords.length - 1]);

        if (dToStart <= dToEnd) {
          orderedCoordinates.push(...coords.slice(1));
          currentEndPoint = coords[coords.length - 1];
        } else {
          const reversed = [...coords].reverse();
          orderedCoordinates.push(...reversed.slice(1));
          currentEndPoint = reversed[reversed.length - 1];
        }
      });

      if (orderedCoordinates.length < 2) return null;

      const routeGeometry = new LineString(orderedCoordinates);
      trackCache.current[cacheKey] = routeGeometry;
      return routeGeometry;
    } catch {
      return null;
    }
  };

  const plotStationOnMap = (stn: EnrichedStation, idx: number) => {
    const coord = fromLonLat([stn.lon, stn.lat]);
    const stationFeature = new Feature({ geometry: new Point(coord) });
    stationFeature.set("stationData", stn);

    const color = idx === 0 ? "#2563eb" : "#cbd5e1";
    stationFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      }),
    );

    stationSourceRef.current.addFeature(stationFeature);

    if (idx === 0) {
      const trainFeature = new Feature({ geometry: new Point(coord) });
      trainFeature.set("isTrain", true);
      trainFeature.setStyle(
        new Style({
          image: new Icon({
            src: TRAIN_FRONT_SVG,
            width: 32,
            height: 32,
            anchor: [0.5, 0.5],
          }),
        }),
      );
      trainSourceRef.current.addFeature(trainFeature);
      trainMarkerRef.current = trainFeature;

      if (mapRef.current) {
        mapRef.current
          .getView()
          .animate({ center: coord, zoom: 10, duration: 500 });
      }
    }
  };

  const plotSegmentOnMap = (geometry: Geometry, segmentData?: Segment) => {
    const feature = new Feature({ geometry });
    feature.set("isRouteSegment", true);
    feature.set("segmentData", segmentData);

    feature.setStyle(getSegmentStyles(segmentData));
    routeSourceRef.current.addFeature(feature);

    if (segmentData?.events && segmentData.events.length > 0) {
      const extent = geometry.getExtent();
      const mid = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

      const eventFeature = new Feature({ geometry: new Point(mid) });
      eventFeature.set("isEventMarker", true);
      eventFeature.set("segmentData", segmentData);

      eventFeature.setStyle(
        new Style({
          image: new Icon({
            src: EVENT_WARNING_SVG,
            width: 26,
            height: 26,
            anchor: [0.5, 0.5],
          }),
        }),
      );
      routeSourceRef.current.addFeature(eventFeature);
    }
  };

  const executeSequentialFlow = async (
    rawList: StationPoint[],
    segList: Segment[],
  ) => {
    clearMapLayers();
    const enrichedList: EnrichedStation[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const currentRaw = rawList[i];

      const stationCoord = await getStationCoordinate(currentRaw.cavStnCode);
      if (!stationCoord) continue;

      const enrichedStn: EnrichedStation = {
        ...currentRaw,
        lon: stationCoord.lon,
        lat: stationCoord.lat,
      };
      enrichedList.push(enrichedStn);

      plotStationOnMap(enrichedStn, enrichedList.length - 1);

      if (enrichedList.length > 1) {
        const prevStation = enrichedList[enrichedList.length - 2];
        const currentSegmentData = segList[enrichedList.length - 2];

        const segmentGeometry = await fetchSegmentTrackGeometry(
          prevStation,
          enrichedStn,
        );

        prevStation.segmentGeometry = segmentGeometry;
        if (segmentGeometry) {
          plotSegmentOnMap(segmentGeometry, currentSegmentData);
        }
      }

      setEnrichedStations([...enrichedList]);
    }

    if (mapRef.current && routeSourceRef.current.getFeatures().length > 0) {
      const extent = routeSourceRef.current.getExtent();
      if (extent && isFinite(extent[0])) {
        mapRef.current
          .getView()
          .fit(extent, { padding: [80, 80, 80, 80], duration: 800 });
      }
    }
  };

  useEffect(() => {
    if (!mapElement.current) return;

    const initialCenter = fromLonLat([76.17, 25.66]);
    const routeLayer = new VectorLayer({ source: routeSourceRef.current });
    const stationLayer = new VectorLayer({ source: stationSourceRef.current });
    const trainLayer = new VectorLayer({ source: trainSourceRef.current });

    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new TileLayer({
          source: new TileWMS({
            url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
            params: { LAYERS: "P_SMMS:india_boundary", TILED: true },
          }),
        }),
        new TileLayer({
          source: new TileWMS({
            url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
            params: { LAYERS: "P_SMMS:railway_station", TILED: true },
          }),
        }),
        routeLayer,
        stationLayer,
        trainLayer,
      ],
      view: new View({ center: initialCenter, zoom: 6 }),
    });

    mapRef.current = map;

    const popupOverlay = new Overlay({
      element: popupRef.current!,
      positioning: "bottom-center",
      offset: [0, -12],
      stopEvent: false,
    });
    map.addOverlay(popupOverlay);
    popupOverlayRef.current = popupOverlay;

    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);

      const element = popupRef.current;
      if (!element) return;

      if (
        feature &&
        (feature.get("isRouteSegment") || feature.get("isEventMarker"))
      ) {
        const segment = feature.get("segmentData") as Segment;
        if (!segment) return;

        const isKavachDisconnected =
          segment.kavachSegment &&
          segment.connectivityStatus === "DISCONNECTED";

        const eventsHtml = segment.events?.length
          ? segment.events
              .map(
                (evt) => `
                    <div style="padding:4px 0; border-top:1px solid #e2e8f0;">
                      <div><b>Type:</b> ${evt.eventType}</div>
                      <div><b>Time:</b> ${evt.eventTime}</div>
                      <div><b>NMS:</b> ${evt.nmsStationCode || "-"}</div>
                      <div><b>COA:</b> ${evt.coaStationCode || "-"}</div>
                    </div>
                  `,
              )
              .join("")
          : `<div style="color:#64748b">No events</div>`;

        element.innerHTML = `
          <div style="
            background:white;
            border:1px solid #cbd5e1;
            border-radius:8px;
            box-shadow:0 6px 20px rgba(0,0,0,.15);
            padding:10px;
            min-width:240px;
            max-width:300px;
            font-family:sans-serif;
            font-size:11px;
            color:#0f172a;
            pointer-events:none;
          ">
            <div style="font-weight:800; font-size:12px; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
              <span>${segment.fromStationCode} → ${segment.toStationCode}</span>
              ${
                isKavachDisconnected
                  ? `<span style="background:#fef3c7; color:#92400e; border:1px solid #fcd34d; font-size:9px; font-weight:800; padding:1px 4px; border-radius:4px;">⚠️ KAVACH DISCONNECTED</span>`
                  : ""
              }
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:6px;">
              <div><b>Status:</b><br/>${segment.connectivityStatus}</div>
              <div><b>Kavach:</b><br/>${
                segment.kavachSegment ? "YES" : "NO"
              }</div>
              <div><b>Conn Dur:</b><br/>${segment.connectedDuration || "-"}</div>
              <div><b>Disc Dur:</b><br/>${
                segment.disconnectedDuration || "-"
              }</div>
            </div>

            <div style="font-weight:800; margin-bottom:4px;">Events (${
              segment.eventCount ?? 0
            })</div>
            <div style="max-height:120px; overflow:auto;">
              ${eventsHtml}
            </div>
          </div>
        `;

        element.classList.remove("hidden");
        popupOverlayRef.current?.setPosition(event.coordinate);
        map.getTargetElement().style.cursor = "pointer";
        return;
      }

      element.classList.add("hidden");
      popupOverlayRef.current?.setPosition(undefined);
      map.getTargetElement().style.cursor = "";
    });

    return () => {
      stopAnimation();
      map.setTarget(undefined);
    };
  }, []);

  useEffect(() => {
    if (queryLocoNo && queryDate) {
      handleSearch(queryLocoNo, queryDate);
    }
  }, [queryLocoNo, queryDate]);

  const focusStationOnMap = (stnCode: string, idx: number) => {
    stopAnimation();
    setCurrentStationIdx(idx);

    const totalSegs = stationSequence.length - 1;
    if (totalSegs > 0) {
      setAnimationProgress((idx / totalSegs) * 100);
    }

    const matchedStn = enrichedStations.find((s) => s.cavStnCode === stnCode);
    if (matchedStn && mapRef.current) {
      mapRef.current.getView().animate({
        center: fromLonLat([matchedStn.lon, matchedStn.lat]),
        zoom: 12,
        duration: 600,
      });
      if (trainMarkerRef.current) {
        const point = trainMarkerRef.current.getGeometry() as Point;
        point.setCoordinates(fromLonLat([matchedStn.lon, matchedStn.lat]));
      }
    }
  };

  const headerTrain = stationSequence[0];
  const stationItemWidth = 90;
  const timelineContentWidth = Math.max(
    stationSequence.length * stationItemWidth,
    800,
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 font-sans text-slate-700 antialiased overflow-hidden">
      {/* HEADER BAR */}
      <header className="h-9 bg-white border-b border-slate-200 px-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-slate-500"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            <span>Back</span>
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-0.5 shadow-2xs">
            <TrainFront className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Loco Journey On Map
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={locoNo}
            onChange={(e) => setLocoNo(e.target.value)}
            placeholder="Loco"
            className="h-6 w-20 rounded border border-slate-300 px-1.5 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-6 rounded border border-slate-300 px-1.5 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSearch(locoNo, selectedDate)}
            disabled={loading}
            className="h-6 rounded bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>

          {enrichedStations.length > 0 && (
            <div className="flex items-center gap-1">
              {!isAnimating && !isPaused && (
                <button
                  onClick={() => animateTrain(enrichedStations)}
                  className="h-6 rounded bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Play
                </button>
              )}

              {isAnimating && (
                <button
                  onClick={pauseAnimation}
                  className="h-6 rounded bg-amber-500 px-2.5 text-[11px] font-semibold text-white hover:bg-amber-600 transition"
                >
                  ⏸ Pause
                </button>
              )}

              {!isAnimating && isPaused && (
                <button
                  onClick={resumeAnimation}
                  className="h-6 rounded bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Resume
                </button>
              )}

              <button
                onClick={resetAnimation}
                className="h-6 rounded bg-slate-600 px-2.5 text-[11px] font-semibold text-white hover:bg-slate-700 transition flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAP & SIDEBAR CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 relative h-full overflow-hidden bg-slate-200">
          <div ref={mapElement} className="w-full h-full absolute inset-0" />
          <div ref={popupRef} className="hidden z-50 pointer-events-none" />

          {/* MAP USER GUIDE / LEGEND MARKER */}
          <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg p-2.5 shadow-md flex flex-col gap-1.5 text-[11px] font-semibold text-slate-800">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-0.5">
              Map Legend / Guide
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-1.5 bg-emerald-500 rounded-full inline-block shadow-2xs" />
              <span>Kavach Track</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="w-5 h-1.5 rounded-full inline-block shadow-2xs"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #22c55e 0px, #22c55e 4px, #f59e0b 4px, #f59e0b 8px)",
                }}
              />
              <span>Disconnected In NMS</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-1.5 bg-rose-500 rounded-full inline-block shadow-2xs" />
              <span>Non-Kavach Track</span>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 fill-amber-100" />
              <span>Event Occurred</span>
            </div>
          </div>

          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1 rounded shadow-md text-[11px] font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="w-[460px] h-[650px] bg-slate-50 border-l border-slate-200 flex flex-col z-10 shrink-0 flex-none font-mono text-[10px] overflow-hidden">
          {stationSequence.length > 0 ? (
            <div className="flex flex-col h-full overflow-hidden p-2 gap-2">
              <div className="bg-white border border-slate-300 rounded-lg p-2 shadow-xs shrink-0 text-xs space-y-1 font-sans w-full">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 bg-slate-50 -mx-2 -mt-2 p-2 rounded-t-lg">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-900 uppercase font-black text-[11px]">
                      Train:
                    </span>
                    <span className="font-extrabold text-slate-950 text-xs">
                      {headerTrain?.cavTrainNumb || "---"} --
                      {[headerTrain?.cavTrainName || "---"]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-900 uppercase font-black text-[11px]">
                      Loco:
                    </span>
                    <span className="font-black text-blue-700 text-xs bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {summary?.locoNumber || "---"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-900 uppercase font-black text-[10px]">
                    Journey
                  </span>
                  <span className="font-extrabold text-emerald-800 text-xs truncate max-w-[170px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {headerTrain?.cavOrigSttn || "---"} ➜{" "}
                    {headerTrain?.cavDstnSttn || "---"}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-emerald-50/70 border border-emerald-100">
                    <span className="text-emerald-950 uppercase font-black text-[10px]">
                      Total Connected
                    </span>
                    <span className="font-black text-emerald-700 text-xs">
                      {summary?.totalConnectedDuration || "0m"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-rose-50/70 border border-rose-100">
                    <span className="text-rose-950 uppercase font-black text-[10px]">
                      Total Disconnected
                    </span>
                    <span className="font-black text-rose-700 text-xs">
                      {summary?.totalDisconnectedDuration || "0m"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-blue-50/70 border border-blue-100">
                    <span className="text-blue-950 uppercase font-black text-[10px]">
                      Total Connected in kavach sec
                    </span>
                    <span className="font-black text-blue-700 text-xs">
                      {summary?.kavachTotalConnectedDuration || "0m"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-amber-50/70 border border-amber-100">
                    <span className="text-amber-950 uppercase font-black text-[10px]">
                      Total Disconnected in kavach sec
                    </span>
                    <span className="font-black text-amber-700 text-xs">
                      {summary?.kavachTotalDisconnectedDuration || "0m"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-purple-50/70 border border-purple-100">
                    <span className="text-purple-950 uppercase font-black text-[10px]">
                      Max Continuous Disconnection Duration
                    </span>
                    <span className="font-black text-purple-700 text-xs">
                      {summary?.maxKavachDisconnectionDuration || "0m"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-900 uppercase font-black text-[10px]">
                    Max Limit
                  </span>
                  <span
                    className={`font-black px-1.5 py-0.2 rounded text-[10px] uppercase ${
                      summary?.locoDisconnectionLimitExceeded
                        ? "bg-rose-100 text-red-800 border border-rose-300"
                        : "bg-emerald-100 text-green-800 border border-emerald-300"
                    }`}
                  >
                    {summary?.locoDisconnectionLimitExceeded
                      ? "Exceeded"
                      : "Normal"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar w-full">
                {stationSequence.map((stn, idx) => {
                  const segment = segments[idx];
                  const isCurrent = idx === currentStationIdx;

                  return (
                    <React.Fragment key={`panel-stn-${idx}`}>
                      <div
                        ref={(el) => (stationCardRefs.current[idx] = el)}
                        onClick={() => focusStationOnMap(stn.cavStnCode, idx)}
                        className={`w-full p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isCurrent
                            ? "bg-blue-100 border-blue-600 text-blue-950 ring-2 ring-blue-500/40 font-black shadow-md"
                            : "bg-white border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm md:text-base font-extrabold tracking-wide">
                          <span
                            className={
                              isCurrent
                                ? "text-blue-600 text-base"
                                : "text-emerald-600 text-base"
                            }
                          >
                            ●
                          </span>
                          <span>{stn.cavStnCode}</span>
                        </div>
                      </div>

                      {segment && (
                        <div className="w-full pl-2 py-1">
                          <div
                            className={`w-full p-3 rounded-lg border-2 ${
                              segment.connectivityStatus === "DISCONNECTED"
                                ? "bg-rose-50 border-rose-300 text-rose-950"
                                : "bg-emerald-50 border-emerald-300 text-emerald-950"
                            }`}
                          >
                            <div className="flex items-center justify-between font-black mb-2 border-b-2 border-slate-300/60 pb-1.5">
                              <span className="text-sm md:text-base flex items-center gap-1.5 tracking-wide">
                                {segment.connectivityStatus === "DISCONNECTED"
                                  ? "❌ DISCONNECTED"
                                  : "✅ CONNECTED"}
                              </span>

                              <span
                                className={`text-xs md:text-sm font-bold px-2 py-0.5 rounded border ${
                                  segment.kavachSegment &&
                                  segment.connectivityStatus === "DISCONNECTED"
                                    ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold"
                                    : "bg-white/80 text-slate-700 border-slate-300"
                                }`}
                              >
                                Kavach sec:{" "}
                                {segment.kavachSegment ? "Yes" : "No"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full my-2">
                              <div className="flex flex-col p-2 rounded-md bg-emerald-100/90 border-2 border-emerald-400 text-emerald-950 shadow-xs">
                                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-900">
                                  Connected Duration
                                </span>
                                <span className="text-base md:text-lg font-black mt-0.5">
                                  {segment.connectedDuration || "0m"}
                                </span>
                              </div>

                              <div className="flex flex-col p-2 rounded-md bg-rose-100/90 border-2 border-rose-400 text-rose-950 shadow-xs">
                                <span className="text-xs uppercase tracking-wider font-extrabold text-rose-900">
                                  Disconnected Duration
                                </span>
                                <span className="text-base md:text-lg font-black mt-0.5">
                                  {segment.disconnectedDuration || "0m"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-slate-800 font-bold border-t border-slate-300/40 pt-1.5">
                              <span>
                                Events:{" "}
                                <strong className="font-black text-black">
                                  {segment.eventCount ?? 0}
                                </strong>
                              </span>
                              <span>
                                {segment.fromStationCode} →{" "}
                                {segment.toStationCode}
                              </span>
                            </div>

                            {segment.events?.length > 0 && (
                              <div className="mt-2 space-y-1.5 border-t-2 border-amber-300 pt-2 max-h-32 overflow-y-auto custom-scrollbar w-full">
                                {segment.events.map((event, index) => (
                                  <div
                                    key={index}
                                    className="w-full bg-white p-2.5 rounded-md border border-amber-300 text-xs shadow-xs flex flex-col gap-1.5 font-bold"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-700 font-extrabold uppercase tracking-wide text-[11px] min-w-[45px]">
                                        Type:
                                      </span>
                                      <span
                                        className={
                                          event.eventType === "DISCONNECTED"
                                            ? "text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200 font-black text-xs"
                                            : "text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200 font-black text-xs"
                                        }
                                      >
                                        {event.eventType}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-700 font-extrabold uppercase tracking-wide text-[11px] min-w-[45px]">
                                        Time:
                                      </span>
                                      <span className="text-slate-950 font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                        {event.eventTime}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-3">
              <MapPin className="h-5 w-5 mb-1 opacity-30 text-slate-400" />
              <p className="text-[12px]">Search Loco to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* SCROLLABLE FOOTER TIMELINE */}
      <footer className="bg-slate-100 border-t border-slate-200 p-2 shrink-0 z-20 flex justify-center items-center w-full">
        <div
          ref={footerScrollContainerRef}
          className="w-full bg-white rounded-xl border border-slate-200 shadow-xs px-4 pt-7 pb-3 flex flex-col overflow-x-auto custom-scrollbar"
        >
          <div
            ref={footerTimelineRef}
            className="relative flex items-center h-12 my-auto px-6"
            style={{ minWidth: `${timelineContentWidth}px` }}
          >
            {/* BASE GRAY TRACK */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full" />

            {/* HIGHLIGHTED PROGRESS TRACK */}
            <div
              className="h-1.5 bg-blue-600 rounded-full absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-75"
              style={{
                width: `calc(${animationProgress}% - ${
                  (animationProgress / 100) * 48
                }px)`,
              }}
            />

            {/* STATIONS ON SCROLLABLE TIMELINE */}
            {stationSequence.length > 0 &&
              stationSequence.map((stn, idx) => {
                const pct =
                  stationSequence.length > 1
                    ? (idx / (stationSequence.length - 1)) * 100
                    : 0;

                const isReached = idx <= currentStationIdx;

                return (
                  <div
                    key={`footer-node-${idx}`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                    style={{
                      left: `calc(${pct}% + ${24 - (pct / 100) * 48}px)`,
                    }}
                    onClick={() => focusStationOnMap(stn.cavStnCode, idx)}
                  >
                    {/* STATION DOT NODE */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        isReached
                          ? "bg-blue-600 border-white ring-2 ring-blue-500/50 scale-110"
                          : "bg-slate-300 border-white hover:bg-slate-400"
                      }`}
                    />

                    {/* STATION CODE TEXT UNDER POINT */}
                    <span
                      className={`text-[11px] mt-2.5 whitespace-nowrap transition-all ${
                        isReached
                          ? "text-blue-700 font-extrabold scale-105"
                          : "text-slate-500 font-semibold"
                      }`}
                    >
                      {stn.cavStnCode}
                    </span>
                  </div>
                );
              })}

            {/* MOVING TRAIN ICON */}
            {/* <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-75 z-20 pointer-events-none"
              style={{
                left: `calc(${animationProgress}% + ${
                  24 - (animationProgress / 100) * 48
                }px)`,
              }}
            >
              <div className="absolute -top-7">
                <svg
                  width="36"
                  height="22"
                  viewBox="0 0 40 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "scaleX(-1)" }}
                >
                  <path
                    d="M3 15C3 15 8 15 13 10C18 5 25 5 35 5V15H3Z"
                    stroke="#1e40af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#3b82f6"
                  />
                  <path
                    d="M1 10H8"
                    stroke="#1e40af"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1 6H12"
                    stroke="#1e40af"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="8"
                    cy="18"
                    r="2.5"
                    stroke="#1e40af"
                    strokeWidth="2"
                    fill="white"
                  />
                  <circle
                    cx="16"
                    cy="18"
                    r="2.5"
                    stroke="#1e40af"
                    strokeWidth="2"
                    fill="white"
                  />
                  <circle
                    cx="24"
                    cy="18"
                    r="2.5"
                    stroke="#1e40af"
                    strokeWidth="2"
                    fill="white"
                  />
                  <circle
                    cx="32"
                    cy="18"
                    r="2.5"
                    stroke="#1e40af"
                    strokeWidth="2"
                    fill="white"
                  />
                </svg>
              </div>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
