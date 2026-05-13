import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useUserStore } from "../stores/userStore";
import { watchPosition, calcDistanceMeters } from "../services/locationService";
import { saveWalk } from "../services/firestoreService";
import { uploadWalkPhoto } from "../services/storageService";
import * as ImagePicker from "expo-image-picker";
import { Pedometer } from "expo-sensors";
import i18n from "../i18n";
import { COLORS } from "../constants/theme";
import type * as Location from "expo-location";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "ActiveWalk">;

export default function ActiveWalkScreen() {
  const navigation = useNavigation<Nav>();
  const { activeWalk, appendRoutePoint, addEvent, updateDistance, updateSteps, setWalkPhoto, endWalk } = useWalkStore();
  const { user } = useUserStore();
  const mapRef = useRef<MapView>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState(0);
  const [walkPhoto, setLocalWalkPhoto] = useState<string | null>(null);

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

    let pedometerSub: { remove: () => void } | null = null;
    Pedometer.isAvailableAsync().then((available) => {
      if (available) {
        pedometerSub = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
          updateSteps(result.steps);
        });
      }
    });

    return () => {
      subRef.current?.remove();
      clearInterval(timer);
      pedometerSub?.remove();
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

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(i18n.t("photoPermission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setLocalWalkPhoto(uri);

    const walk = useWalkStore.getState().activeWalk;
    if (!walk) return;
    try {
      const url = await uploadWalkPhoto(uri, walk.id);
      setWalkPhoto(url);
    } catch {
      setWalkPhoto(uri);
    }
  }

  if (!activeWalk) return null;

  const coords = activeWalk.route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const lastCoord = coords[coords.length - 1];
  const distKm = (activeWalk.distanceMeters / 1000).toFixed(2);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  const pooCount = activeWalk.events.filter((e) => e.type === "poo").length;
  const peeCount = activeWalk.events.filter((e) => e.type === "pee").length;

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
        <StatItem label={i18n.t("steps")} value={steps.toString()} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.eventBtn, styles.pooBtn]} onPress={() => handleLogEvent("poo")}>
          <Text style={styles.eventBtnText}>💩 {i18n.t("logPoo")}{pooCount > 0 ? `  ×${pooCount}` : ""}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.eventBtn, styles.peeBtn]} onPress={() => handleLogEvent("pee")}>
          <Text style={styles.eventBtnText}>💧 {i18n.t("logPee")}{peeCount > 0 ? `  ×${peeCount}` : ""}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
          {walkPhoto ? (
            <Image source={{ uri: walkPhoto }} style={styles.photoThumb} />
          ) : (
            <Text style={styles.photoBtnText}>📷</Text>
          )}
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
  actions: { flexDirection: "row", padding: 12, gap: 10, backgroundColor: COLORS.surface },
  eventBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  pooBtn: { backgroundColor: "#8B4513" },
  peeBtn: { backgroundColor: "#3182CE" },
  eventBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  bottomRow: { flexDirection: "row", padding: 12, gap: 10, backgroundColor: COLORS.surface, paddingBottom: 20 },
  photoBtn: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  photoBtnText: { fontSize: 24 },
  photoThumb: { width: 48, height: 48, borderRadius: 10 },
  endBtn: { flex: 1, backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  endBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
