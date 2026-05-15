import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useThemeStore } from "../stores/themeStore";
import { useWalkStore } from "../stores/walkStore";
import { deleteWalk as deleteWalkDoc } from "../services/firestoreService";
import i18n from "../i18n";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { RoutePoint } from "../models/Walk";
import type { Theme } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "WalkDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function routeRegion(route: RoutePoint[]) {
  if (route.length === 0) return { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, 0.004) * 1.6,
    longitudeDelta: Math.max(maxLng - minLng, 0.004) * 1.6,
  };
}

export default function WalkDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { walk } = route.params;
  const { colors } = useThemeStore();
  const { deleteWalk } = useWalkStore();
  const mapRef = useRef<MapView>(null);
  const [deleting, setDeleting] = useState(false);
  const s = makeStyles(colors);

  function handleDelete() {
    Alert.alert("この散歩記録を削除しますか？", "削除すると元に戻せません。", [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteWalkDoc(walk.id);
            deleteWalk(walk.id);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Tabs");
          } catch (e: any) {
            Alert.alert(i18n.t("error"), e.message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

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

  return (
    <View style={s.container}>
      {walk.route.length > 1 ? (
        <MapView ref={mapRef} style={s.map} initialRegion={routeRegion(walk.route)}>
          <Polyline coordinates={coords} strokeColor={colors.primary} strokeWidth={4} />
          {walk.events.map((ev, i) => (
            <Marker key={i} coordinate={{ latitude: ev.location.lat, longitude: ev.location.lng }}
              title={ev.type === "poo" ? "💩" : "💧"} pinColor={ev.type === "poo" ? "brown" : "blue"} />
          ))}
        </MapView>
      ) : (
        <View style={s.noMap}>
          <Text style={s.noMapText}>🗺️</Text>
          <Text style={s.noMapSub}>ルートデータなし</Text>
        </View>
      )}

      <ScrollView style={s.sheet} contentContainerStyle={s.sheetContent}>
        <View style={s.handle} />
        <Text style={s.dateText}>{dateStr}  {startTime}</Text>

        <View style={s.statGrid}>
          <StatCard label={i18n.t("distance")} value={distKm} unit="km" colors={colors} />
          <StatCard label={i18n.t("duration")} value={`${mins}:${String(secs).padStart(2, "0")}`} colors={colors} />
          {(walk.steps ?? 0) > 0 && <StatCard label={i18n.t("steps")} value={(walk.steps ?? 0).toLocaleString()} colors={colors} />}
          {walk.weather && <StatCard label={i18n.t("conditionLabel")} value={`${Math.round(walk.weather.temp)}°C`} colors={colors} />}
        </View>

        {(pooCount > 0 || peeCount > 0) && (
          <View style={s.eventRow}>
            {pooCount > 0 && <View style={s.eventBadge}><Text style={s.eventEmoji}>💩</Text><Text style={s.eventCount}>×{pooCount}</Text></View>}
            {peeCount > 0 && <View style={s.eventBadge}><Text style={s.eventEmoji}>💧</Text><Text style={s.eventCount}>×{peeCount}</Text></View>}
          </View>
        )}

        {!!walk.photoUrl && <Image source={{ uri: walk.photoUrl }} style={s.walkPhoto} resizeMode="cover" />}

        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} disabled={deleting}>
          <Text style={s.deleteBtnText}>{deleting ? "削除中..." : "この散歩を削除"}</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, unit, colors }: { label: string; value: string; unit?: string; colors: Theme }) {
  return (
    <View style={[cardS.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[cardS.value, { color: colors.text }]}>
        {value}{unit ? <Text style={[cardS.unit, { color: colors.textMuted }]}> {unit}</Text> : null}
      </Text>
      <Text style={[cardS.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}
const cardS = StyleSheet.create({
  card: { flex: 1, minWidth: "40%", borderRadius: 20, padding: 16, borderWidth: 1 },
  value: { fontSize: 22, fontWeight: "700" },
  unit: { fontSize: 14, fontWeight: "400" },
  label: { fontSize: 12, marginTop: 4 },
});

function makeStyles(c: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    map: { height: 260 },
    noMap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
    noMapText: { fontSize: 64 },
    noMapSub: { color: c.textMuted, marginTop: 8 },
    sheet: { flex: 1, backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    sheetContent: { padding: 20, paddingBottom: 48 },
    deleteBtn: { marginTop: 24, borderWidth: 1, borderColor: c.danger, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
    deleteBtnText: { color: c.danger, fontWeight: "600", fontSize: 15 },
    handle: { width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    dateText: { fontSize: 14, color: c.textMuted, marginBottom: 16 },
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
    eventRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    eventBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: c.background, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: c.border,
    },
    eventEmoji: { fontSize: 18 },
    eventCount: { fontSize: 15, fontWeight: "600", color: c.text },
    walkPhoto: { width: "100%", height: 200, borderRadius: 20 },
  });
}
