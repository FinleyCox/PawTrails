import * as Location from "expo-location";
import { RoutePoint } from "../models/Walk";

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentPosition(): Promise<RoutePoint> {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    ts: loc.timestamp,
  };
}

const MIN_DISTANCE_METERS = 8;
const MAX_ACCURACY_METERS = 20;

export function watchPosition(
  callback: (point: RoutePoint) => void
): Promise<Location.LocationSubscription> {
  let lastPoint: RoutePoint | null = null;

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: MIN_DISTANCE_METERS,
    },
    (loc) => {
      // 精度が悪いポイントは無視
      if (loc.coords.accuracy != null && loc.coords.accuracy > MAX_ACCURACY_METERS) return;

      const point: RoutePoint = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        ts: loc.timestamp,
      };

      // 前のポイントと近すぎる場合はスキップ（GPSブレ対策）
      if (lastPoint && haversine(lastPoint, point) < MIN_DISTANCE_METERS) return;

      lastPoint = point;
      callback(point);
    }
  );
}

export function calcDistanceMeters(points: RoutePoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

function haversine(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
