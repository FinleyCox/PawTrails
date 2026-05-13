import { RoutePoint } from "../models/Walk";

// GDPR：自宅エリアマスキング
// 散歩の開始・終了付近（自宅周辺）の GPS ポイントを除去する
// 200m 以内のポイントを削除することで居住地が特定されるのを防ぐ
const MASK_RADIUS_METERS = 200;

export function maskRouteForPrivacy(route: RoutePoint[]): RoutePoint[] {
  if (route.length < 2) return route;

  const home = route[0]; // 開始点 ≈ 自宅

  // 自宅から MASK_RADIUS_METERS 以上離れた点だけ残す（開始側）
  let startIdx = 0;
  for (let i = 0; i < route.length; i++) {
    if (haversineMeters(home, route[i]) >= MASK_RADIUS_METERS) {
      startIdx = i;
      break;
    }
  }

  // 終了側も同様にマスク（帰宅時に自宅に近づいた部分を除去）
  let endIdx = route.length - 1;
  for (let i = route.length - 1; i >= 0; i--) {
    if (haversineMeters(home, route[i]) >= MASK_RADIUS_METERS) {
      endIdx = i;
      break;
    }
  }

  return route.slice(startIdx, endIdx + 1);
}

function haversineMeters(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
