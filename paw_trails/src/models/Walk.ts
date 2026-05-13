export interface RoutePoint {
  lat: number;
  lng: number;
  ts: number;
}

export interface WalkEvent {
  type: "poo" | "pee";
  location: { lat: number; lng: number };
  ts: number;
}

export interface WeatherSnapshot {
  temp: number;
  condition: string;
  estimatedGroundTemp: number;
}

export interface Walk {
  id: string;
  familyId: string;
  dogIds: string[];
  walkerId: string;
  startedAt: number;
  endedAt?: number;
  route: RoutePoint[];
  weather?: WeatherSnapshot;
  events: WalkEvent[];
  distanceMeters: number;
}
