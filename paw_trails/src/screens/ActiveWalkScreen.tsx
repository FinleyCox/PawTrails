import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useUserStore } from "../stores/userStore";
import { watchPosition, calcDistanceMeters } from "../services/locationService";
import { saveWalk } from "../services/firestoreService";
import i18n from "../i18n";
import { COLORS, GROUND_TEMP_DANGER } from "../constants/theme";
import type * as Location from "expo-location";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "ActiveWalk">;

export default function ActiveWalkScreen() {
  const navigation = useNavigation<Nav>();
  const { activeWalk, appendRoutePoint, addEvent, updateDistance, endWalk } = useWalkStore();
  const { user } = useUserStore();
  const mapRef = useRef<MapView>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    watchPosition((point) => {
      appendRoutePoint(point);
      const walk = useWalkStore.getState().activeWalk;
      if (walk) updateDistance(calcDistanceMeters(walk.route));
      mapRef.current?.animateToRegion(
        { latitude: point.lat, longitude: point.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        300
      );
    })
      .then((sub) => { subRef.current = sub; })
      .catch((err) => console.warn("Location watch error:", err));

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      subRef.current?.remove();
      clearInterval(timer);
    };
  }, []);

  function handleEnd() {
    Alert.alert(i18n.t("endWalk"), "", [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("endWalk"),
        style: "destructive",
        onPress: async () => {
          const finished = endWalk();
          if (finished && user?.familyId) {
            await saveWalk(finished, user.settings?.privacyMasking ?? true).catch(() => {});
          }
          navigation.navigate("Tabs");
        },
      },
    ]);
  }

  function handleLogEvent(type: "poo" | "pee") {
    const walk = useWalkStore.getState().activeWalk;
    if (!walk || walk.route.length === 0) return;
    const last = walk.route[walk.route.length - 1];
    addEvent({ type, location: { lat: last.lat, lng: last.lng }, ts: Date.now() });
  }

  if (!activeWalk) return null;

  const coords = activeWalk.route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const lastCoord = coords[coords.length - 1];
  const distKm = (activeWalk.distanceMeters / 1000).toFixed(2);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  const groundTemp = activeWalk.weather?.estimatedGroundTemp;
  const pooCount = activeWalk.events.filter((e) => e.type === "poo").length;
  const peeCount = activeWalk.events.filter((e) => e.type === "pee").length;
  const tempDanger = groundTemp !== undefined && groundTemp >= GROUND_TEMP_DANGER;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          lastCoord
            ? { ...lastCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }
            : { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        }
      >
        {coords.length > 1 && (
          <Polyline coordinates={coords} strokeColor={COLORS.primary} strokeWidth={4} />
        )}
        {activeWalk.events.map((ev, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: ev.location.lat, longitude: ev.location.lng }}
            title={ev.type === "poo" ? "💩" : "💧"}
            pinColor={ev.type === "poo" ? "brown" : "blue"}
          />
        ))}
      </MapView>

      <View style={styles.statsBar}>
        <StatItem label={i18n.t("distance")} value={`${distKm} km`} />
        <StatItem label={i18n.t("duration")} value={`${mins}:${secs}`} />
        {groundTemp !== undefined && (
          <StatItem label={i18n.t("groundTemp")} value={`${groundTemp.toFixed(0)}°C`} danger={tempDanger} />
        )}
      </View>

      {tempDanger && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{i18n.t("groundTempWarning")}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.eventBtn, styles.pooBtn]} onPress={() => handleLogEvent("poo")}>
          <Text style={styles.eventBtnText}>💩 {i18n.t("logPoo")}{pooCount > 0 ? `  ×${pooCount}` : ""}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.eventBtn, styles.peeBtn]} onPress={() => handleLogEvent("pee")}>
          <Text style={styles.eventBtnText}>💧 {i18n.t("logPee")}{peeCount > 0 ? `  ×${peeCount}` : ""}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
          <Text style={styles.endBtnText}>{i18n.t("endWalk")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && styles.statValueDanger]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  statsBar: {
    flexDirection: "row", backgroundColor: COLORS.surface, paddingVertical: 12,
    paddingHorizontal: 16, justifyContent: "space-around", elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: -2 },
  },
  statItem: { alignItems: "center" },
  statLabel: { fontSize: 11, color: COLORS.textMuted },
  statValue: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  statValueDanger: { color: COLORS.danger },
  warningBanner: { backgroundColor: COLORS.warning, padding: 10, alignItems: "center" },
  warningText: { color: "#fff", fontWeight: "700" },
  actions: { flexDirection: "row", padding: 16, gap: 10, backgroundColor: COLORS.surface },
  eventBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  pooBtn: { backgroundColor: "#8B4513" },
  peeBtn: { backgroundColor: "#3182CE" },
  eventBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  endBtn: { flex: 1, backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  endBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
