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
  steps?: number;
  photoUrl?: string;
}
