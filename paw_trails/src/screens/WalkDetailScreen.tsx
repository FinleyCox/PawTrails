import React, { useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useRoute, RouteProp } from "@react-navigation/native";
import { COLORS, GROUND_TEMP_DANGER } from "../constants/theme";
import i18n from "../i18n";
import type { RootStackParamList } from "../../App";
import type { RoutePoint } from "../models/Walk";

type Route = RouteProp<RootStackParamList, "WalkDetail">;

function routeRegion(route: RoutePoint[]) {
  if (route.length === 0) return { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, 0.004) * 1.6,
    longitudeDelta: Math.max(maxLng - minLng, 0.004) * 1.6,
  };
}

export default function WalkDetailScreen() {
  const route = useRoute<Route>();
  const { walk } = route.params;
  const mapRef = useRef<MapView>(null);

  const coords = walk.route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const durationMs = (walk.endedAt ?? Date.now()) - walk.startedAt;
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.floor((durationMs % 60000) / 1000);
  const distKm = (walk.distanceMeters / 1000).toFixed(2);
  const date = new Date(walk.startedAt);
  const startTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString();
  const pooCount = walk.events.filter((e) => e.type === "poo").length;
  const peeCount = walk.events.filter((e) => e.type === "pee").length;
  const groundTemp = walk.weather?.estimatedGroundTemp;
  const tempDanger = groundTemp !== undefined && groundTemp >= GROUND_TEMP_DANGER;

  return (
    <View style={styles.container}>
      {walk.route.length > 1 ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={routeRegion(walk.route)}
        >
          <Polyline coordinates={coords} strokeColor={COLORS.primary} strokeWidth={4} />
          {walk.events.map((ev, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: ev.location.lat, longitude: ev.location.lng }}
              title={ev.type === "poo" ? "💩" : "💧"}
              pinColor={ev.type === "poo" ? "brown" : "blue"}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.noMap}>
          <Text style={styles.noMapText}>🗺️</Text>
          <Text style={styles.noMapSub}>ルートデータなし</Text>
        </View>
      )}

      <ScrollView style={styles.statsSheet} contentContainerStyle={styles.statsContent}>
        <Text style={styles.dateText}>{dateStr}  {startTime}</Text>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{distKm}</Text>
            <Text style={styles.statLabel}>{i18n.t("distance")} (km)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mins}:{String(secs).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>{i18n.t("duration")}</Text>
          </View>
          {groundTemp !== undefined && (
            <View style={styles.statBox}>
              <Text style={[styles.statValue, tempDanger && styles.danger]}>
                {Math.round(groundTemp)}°C
              </Text>
              <Text style={styles.statLabel}>{i18n.t("groundTempLabel")}</Text>
            </View>
          )}
        </View>

        <View style={styles.eventRow}>
          {pooCount > 0 && (
            <View style={styles.eventBadge}>
              <Text style={styles.eventEmoji}>💩</Text>
              <Text style={styles.eventCount}>×{pooCount}</Text>
            </View>
          )}
          {peeCount > 0 && (
            <View style={styles.eventBadge}>
              <Text style={styles.eventEmoji}>💧</Text>
              <Text style={styles.eventCount}>×{peeCount}</Text>
            </View>
          )}
          {pooCount === 0 && peeCount === 0 && (
            <Text style={styles.noEvents}>{i18n.t("eventsLabel")}: 0</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  noMap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  noMapText: { fontSize: 64 },
  noMapSub: { color: COLORS.textMuted, marginTop: 8 },
  statsSheet: { maxHeight: 220, backgroundColor: COLORS.background },
  statsContent: { padding: 20 },
  dateText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  danger: { color: COLORS.danger },
  eventRow: { flexDirection: "row", gap: 16 },
  eventBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  eventEmoji: { fontSize: 20 },
  eventCount: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  noEvents: { color: COLORS.textMuted, fontSize: 14 },
});
