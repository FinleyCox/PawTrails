import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image,
  ScrollView, ActivityIndicator,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import AddDogModal from "../components/AddDogModal";
import PaywallModal from "../components/PaywallModal";
import { useNavigation } from "@react-navigation/native";
import { useDogStore } from "../stores/dogStore";
import { useWalkStore } from "../stores/walkStore";
import { useUserStore } from "../stores/userStore";
import { requestPermissions, getCurrentPosition } from "../services/locationService";
import { fetchWeather } from "../services/weatherService";
import i18n from "../i18n";
import { COLORS } from "../constants/theme";
import * as Crypto from "expo-crypto";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { WeatherSnapshot, RoutePoint } from "../models/Walk";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function conditionEmoji(c: string) {
  const map: Record<string, string> = {
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  };
  return map[c] ?? "🌤️";
}

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

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { dogs, selectedDogIds, toggleDogSelection } = useDogStore();
  const { startWalk, walks } = useWalkStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const singleDog = dogs.length === 1 ? dogs[0] : null;
  const isPremium = user?.settings?.isPremium === true;

  // Today's completed walks
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayWalks = walks.filter((w) => w.startedAt >= todayStart.getTime() && w.endedAt != null);

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      try {
        const granted = await requestPermissions();
        if (!granted || cancelled) return;
        const pos = await getCurrentPosition();
        if (cancelled) return;
        const w = await fetchWeather(pos.lat, pos.lng);
        if (!cancelled) setWeather(w);
      } catch {
        // weather is optional
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }
    loadWeather();
    return () => { cancelled = true; };
  }, []);

  function handleAddDog() {
    if (!isPremium && dogs.length >= 1) {
      setShowPaywall(true);
    } else {
      setShowAddDog(true);
    }
  }

  async function handleStartWalk() {
    const dogIds = singleDog ? [singleDog.id] : selectedDogIds;
    if (dogIds.length === 0) {
      Alert.alert(i18n.t("selectDogs"));
      return;
    }
    setLoading(true);
    try {
      const granted = await requestPermissions();
      if (!granted) { Alert.alert("Location permission required"); return; }
      const pos = await getCurrentPosition();
      let walkWeather: WeatherSnapshot | undefined = weather ?? undefined;
      if (!walkWeather) {
        try { walkWeather = await fetchWeather(pos.lat, pos.lng); } catch { /* optional */ }
      }
      startWalk({
        id: Crypto.randomUUID(),
        familyId: user?.familyId ?? "local",
        dogIds,
        walkerId: user?.id ?? "local",
        startedAt: Date.now(),
        route: [pos],
        weather: walkWeather,
        events: [],
        distanceMeters: 0,
      });
      navigation.navigate("ActiveWalk");
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {singleDog ? i18n.t("walkingWith", { name: singleDog.name }) : i18n.t("selectDogs")}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddDog}>
            <Text style={styles.addButtonText}>＋ {i18n.t("addDog")}</Text>
          </TouchableOpacity>
        </View>

        {/* Dog section */}
        {dogs.length === 0 ? (
          <Text style={styles.empty}>{i18n.t("noDogs")}</Text>
        ) : singleDog ? (
          <View style={styles.singleDogCard}>
            {singleDog.photoUrl ? (
              <Image source={{ uri: singleDog.photoUrl }} style={styles.singleDogPhoto} />
            ) : (
              <View style={styles.singleDogPlaceholder}><Text style={{ fontSize: 40 }}>🐾</Text></View>
            )}
            <Text style={styles.singleDogName}>{singleDog.name}</Text>
            {!!singleDog.breed && <Text style={styles.dogBreed}>{singleDog.breed}</Text>}
          </View>
        ) : (
          dogs.map((dog) => {
            const selected = selectedDogIds.includes(dog.id);
            return (
              <TouchableOpacity
                key={dog.id}
                style={[styles.dogCard, selected && styles.dogCardSelected]}
                onPress={() => toggleDogSelection(dog.id)}
              >
                {dog.photoUrl ? (
                  <Image source={{ uri: dog.photoUrl }} style={styles.dogPhoto} />
                ) : (
                  <View style={styles.dogPhotoPlaceholder}><Text style={{ fontSize: 22 }}>🐾</Text></View>
                )}
                <View style={styles.dogInfo}>
                  <Text style={[styles.dogName, selected && styles.dogNameSelected]}>{dog.name}</Text>
                  {!!dog.breed && <Text style={styles.dogBreed}>{dog.breed}</Text>}
                </View>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })
        )}

        {/* Weather widget */}
        {weatherLoading ? (
          <View style={styles.weatherCard}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.weatherLoadingText}>{i18n.t("weatherLoading")}</Text>
          </View>
        ) : weather ? (
          <View style={styles.weatherCard}>
            <Text style={styles.weatherEmoji}>{conditionEmoji(weather.condition)}</Text>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{Math.round(weather.temp)}°C</Text>
              <Text style={styles.weatherCondition}>{weather.condition}</Text>
            </View>
            <View style={styles.weatherDivider} />
            <View style={styles.weatherGroundBox}>
              <Text style={styles.weatherGroundLabel}>{i18n.t("conditionLabel")}</Text>
              <Text style={styles.weatherGroundTemp}>{weather.condition}</Text>
            </View>
          </View>
        ) : null}

        {/* Today's walks */}
        <Text style={styles.sectionTitle}>{i18n.t("todayWalks")}</Text>
        {todayWalks.length === 0 ? (
          <Text style={styles.empty}>{i18n.t("noWalksToday")}</Text>
        ) : (
          todayWalks.map((walk) => {
            const durationMs = (walk.endedAt ?? Date.now()) - walk.startedAt;
            const mins = Math.floor(durationMs / 60000);
            const distKm = (walk.distanceMeters / 1000).toFixed(2);
            const coords = walk.route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
            return (
              <TouchableOpacity key={walk.id} style={styles.walkCard} onPress={() => navigation.navigate("WalkDetail", { walk })}>
                {walk.route.length > 1 && (
                  <MapView
                    style={styles.miniMap}
                    initialRegion={routeRegion(walk.route)}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    pointerEvents="none"
                  >
                    <Polyline coordinates={coords} strokeColor={COLORS.primary} strokeWidth={3} />
                  </MapView>
                )}
                <View style={styles.walkStats}>
                  <Text style={styles.walkStat}>{distKm} km</Text>
                  <Text style={styles.walkStatSep}>·</Text>
                  <Text style={styles.walkStat}>{mins} {i18n.t("min")}</Text>
                  <Text style={styles.walkStatSep}>·</Text>
                  <Text style={styles.walkStat}>{walk.events.length} {i18n.t("eventsLabel")}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Sticky start button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={handleStartWalk}
          disabled={loading}
        >
          <Text style={styles.startButtonText}>
            {loading ? "..." : i18n.t("startWalk")}
          </Text>
        </TouchableOpacity>
      </View>

      <AddDogModal visible={showAddDog} onClose={() => setShowAddDog(false)} />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribed={() => setShowAddDog(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 8 },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text, flex: 1, marginRight: 8 },
  addButton: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  empty: { color: COLORS.textMuted, marginBottom: 16 },
  // Single dog
  singleDogCard: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  singleDogPhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  singleDogPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.surface, alignItems: "center",
    justifyContent: "center", marginBottom: 12,
  },
  singleDogName: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  // Multi dog
  dogCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 2, borderColor: "transparent",
    flexDirection: "row", alignItems: "center",
  },
  dogCardSelected: { borderColor: COLORS.primary },
  dogPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  dogPhotoPlaceholder: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "#F0F0F0",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  dogInfo: { flex: 1 },
  dogName: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  dogNameSelected: { color: COLORS.primary },
  dogBreed: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  checkmark: { fontSize: 20, color: COLORS.primary, fontWeight: "700" },
  // Weather
  weatherCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12,
  },
  weatherEmoji: { fontSize: 36 },
  weatherInfo: { flex: 1 },
  weatherTemp: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  weatherCondition: { fontSize: 13, color: COLORS.textMuted },
  weatherDivider: { width: 1, height: 40, backgroundColor: "#E2E8F0" },
  weatherGroundBox: { alignItems: "center", minWidth: 70 },
  weatherGroundLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  weatherGroundTemp: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  weatherGroundDanger: { color: COLORS.danger },
  weatherLoadingText: { color: COLORS.textMuted, fontSize: 13, marginLeft: 8 },
  // Section
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  // Walk cards
  walkCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12,
    overflow: "hidden",
  },
  miniMap: { height: 160, width: "100%" },
  walkStats: {
    flexDirection: "row", alignItems: "center", padding: 12,
    gap: 6,
  },
  walkStat: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  walkStatSep: { fontSize: 13, color: COLORS.textMuted },
  // Footer
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  startButton: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: "center",
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
