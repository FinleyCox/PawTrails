import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useUserStore } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import ConfirmSheet from "../components/ConfirmSheet";
import { watchPosition, calcDistanceMeters } from "../services/locationService";
import { saveWalk } from "../services/firestoreService";
import { uploadWalkPhoto } from "../services/storageService";
import * as ImagePicker from "expo-image-picker";
import { Pedometer } from "expo-sensors";
import i18n from "../i18n";
import type * as Location from "expo-location";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { Theme } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "ActiveWalk">;

export default function ActiveWalkScreen() {
  const navigation = useNavigation<Nav>();
  const { activeWalk, appendRoutePoint, addEvent, updateDistance, updateSteps, setWalkPhoto, endWalk } = useWalkStore();
  const { user } = useUserStore();
  const { colors } = useThemeStore();
  const mapRef = useRef<MapView>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState(0);
  const [walkPhoto, setLocalWalkPhoto] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const s = makeStyles(colors);

  useEffect(() => {
    watchPosition((point) => {
      appendRoutePoint(point);
      const walk = useWalkStore.getState().activeWalk;
      if (walk) updateDistance(calcDistanceMeters(walk.route));
      mapRef.current?.animateToRegion(
        { latitude: point.lat, longitude: point.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 300
      );
    })
      .then((sub) => { subRef.current = sub; })
      .catch((err) => console.warn("Location watch error:", err));

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    let pedometerSub: { remove: () => void } | null = null;
    (async () => {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== "granted") return;
      const available = await Pedometer.isAvailableAsync();
      if (available) {
        pedometerSub = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
          updateSteps(result.steps);
        });
      }
    })();

    return () => {
      subRef.current?.remove();
      clearInterval(timer);
      pedometerSub?.remove();
    };
  }, []);

  function handleEnd() {
    setShowEndConfirm(true);
  }

  async function doEndWalk() {
    setShowEndConfirm(false);
    const finished = endWalk();
    if (finished && user?.familyId) {
      await saveWalk(finished, user.settings?.privacyMasking ?? true).catch(() => {});
    }
    navigation.navigate("Tabs");
  }

  function handleLogEvent(type: "poo" | "pee") {
    const walk = useWalkStore.getState().activeWalk;
    if (!walk || walk.route.length === 0) return;
    const last = walk.route[walk.route.length - 1];
    addEvent({ type, location: { lat: last.lat, lng: last.lng }, ts: Date.now() });
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert(i18n.t("photoPermission")); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true, aspect: [1, 1],
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
    <View style={s.container}>
      <ConfirmSheet
        visible={showEndConfirm}
        title="散歩を終了しますか？"
        confirmLabel={i18n.t("endWalk")}
        cancelLabel={i18n.t("cancel")}
        destructive
        onConfirm={doEndWalk}
        onCancel={() => setShowEndConfirm(false)}
      />
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={
          lastCoord
            ? { ...lastCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }
            : { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        }
      >
        {coords.length > 1 && <Polyline coordinates={coords} strokeColor={colors.primary} strokeWidth={4} />}
        {activeWalk.events.map((ev, i) => (
          <Marker key={i} coordinate={{ latitude: ev.location.lat, longitude: ev.location.lng }}
            title={ev.type === "poo" ? "💩" : "💧"} pinColor={ev.type === "poo" ? "brown" : "blue"} />
        ))}
      </MapView>

      <View style={s.statsBar}>
        <StatItem label={i18n.t("distance")} value={distKm} unit="km" c={colors} />
        <View style={s.statDivider} />
        <StatItem label={i18n.t("duration")} value={`${mins}:${secs}`} c={colors} />
        <View style={s.statDivider} />
        <StatItem label={i18n.t("steps")} value={steps.toLocaleString()} c={colors} />
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={[s.eventBtn, { backgroundColor: "#A0522D" }]} onPress={() => handleLogEvent("poo")}>
          <Text style={s.eventBtnText}>💩</Text>
          <Text style={s.eventBtnLabel}>{i18n.t("logPoo")}{pooCount > 0 ? ` ×${pooCount}` : ""}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.eventBtn, { backgroundColor: "#3B82F6" }]} onPress={() => handleLogEvent("pee")}>
          <Text style={s.eventBtnText}>💧</Text>
          <Text style={s.eventBtnLabel}>{i18n.t("logPee")}{peeCount > 0 ? ` ×${peeCount}` : ""}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bottomRow}>
        <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto}>
          {walkPhoto
            ? <Image source={{ uri: walkPhoto }} style={s.photoThumb} />
            : <Text style={s.photoBtnText}>📷</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={s.endBtn} onPress={handleEnd}>
          <Text style={s.endBtnText}>{i18n.t("endWalk")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({ label, value, unit, c }: { label: string; value: string; unit?: string; c: Theme }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: c.text }}>{value}</Text>
        {unit && <Text style={{ fontSize: 12, color: c.textMuted }}>{unit}</Text>}
      </View>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    map: { flex: 1 },
    statsBar: {
      flexDirection: "row", backgroundColor: c.surface,
      paddingVertical: 16, paddingHorizontal: 20,
      justifyContent: "space-around", alignItems: "center",
      borderTopWidth: 1, borderTopColor: c.border,
    },
    statDivider: { width: 1, height: 32, backgroundColor: c.border },
    actions: { flexDirection: "row", padding: 12, gap: 10, backgroundColor: c.surface },
    eventBtn: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
    eventBtnText: { fontSize: 18 },
    eventBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14 },
    bottomRow: { flexDirection: "row", padding: 12, gap: 10, backgroundColor: c.surface, paddingBottom: 24 },
    photoBtn: {
      width: 54, height: 54, borderRadius: 16, backgroundColor: c.background,
      borderWidth: 1.5, borderColor: c.primary, alignItems: "center", justifyContent: "center",
    },
    photoBtnText: { fontSize: 24 },
    photoThumb: { width: 50, height: 50, borderRadius: 14 },
    endBtn: { flex: 1, backgroundColor: c.danger, borderRadius: 20, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
    endBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
}
