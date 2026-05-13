import { create } from "zustand";
import { Walk, RoutePoint, WalkEvent, WeatherSnapshot } from "../models/Walk";

interface WalkState {
  activeWalk: Walk | null;
  walks: Walk[];
  startWalk: (walk: Walk) => void;
  appendRoutePoint: (point: RoutePoint) => void;
  addEvent: (event: WalkEvent) => void;
  setWeather: (weather: WeatherSnapshot) => void;
  updateDistance: (meters: number) => void;
  endWalk: () => Walk | null;
  setWalks: (walks: Walk[]) => void;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  activeWalk: null,
  walks: [],
  startWalk: (walk) => set({ activeWalk: walk }),
  appendRoutePoint: (point) =>
    set((s) => {
      if (!s.activeWalk) return s;
      return {
        activeWalk: {
          ...s.activeWalk,
          route: [...s.activeWalk.route, point],
        },
      };
    }),
  addEvent: (event) =>
    set((s) => {
      if (!s.activeWalk) return s;
      return {
        activeWalk: {
          ...s.activeWalk,
          events: [...s.activeWalk.events, event],
        },
      };
    }),
  setWeather: (weather) =>
    set((s) => {
      if (!s.activeWalk) return s;
      return { activeWalk: { ...s.activeWalk, weather } };
    }),
  updateDistance: (meters) =>
    set((s) => {
      if (!s.activeWalk) return s;
      return { activeWalk: { ...s.activeWalk, distanceMeters: meters } };
    }),
  endWalk: () => {
    const walk = get().activeWalk;
    if (!walk) return null;
    const finished: Walk = { ...walk, endedAt: Date.now() };
    set((s) => ({ activeWalk: null, walks: [finished, ...s.walks] }));
    return finished;
  },
  setWalks: (walks) => set({ walks }),
}));
