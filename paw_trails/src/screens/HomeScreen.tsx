import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image,
  ScrollView, ActivityIndicator, Animated,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from "@react-native-community/netinfo";
import { Sun, Cloud, CloudRain, Snowflake, Wind, PawPrint, Plus } from "lucide-react-native";
import SkeletonBox from "../components/SkeletonBox";
import AddDogModal from "../components/AddDogModal";
import PaywallModal from "../components/PaywallModal";
import { useNavigation } from "@react-navigation/native";
import { useDogStore } from "../stores/dogStore";
import { useWalkStore } from "../stores/walkStore";
import { useUserStore } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import { requestPermissions, getCurrentPosition } from "../services/locationService";
import { fetchWeather } from "../services/weatherService";
import i18n from "../i18n";
import * as Crypto from "expo-crypto";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { WeatherSnapshot, RoutePoint } from "../models/Walk";
import type { Dog } from "../models/Dog";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function pawSignal(temp: number, condition: string): { label: string; color: string } {
  // 雨・雪はアスファルトが冷えるため安全
  if (condition === "Rain" || condition === "Drizzle" || condition === "Snow") {
    return { label: "🌧 路面は安全", color: "#5C8F72" };
  }
  if (temp < 25) return { label: "✅ 路面は安全", color: "#5C8F72" };
  if (temp < 30) return { label: "⚠️ やや熱い", color: "#F59E0B" };
  if (temp < 35) return { label: "🔴 危険・早朝/夕方のみ", color: "#EF4444" };
  return { label: "🚫 散歩不可", color: "#DC2626" };
}

function WeatherIcon({ condition, size, color }: { condition: string; size: number; color: string }) {
  if (condition === "Clear") return <Sun size={size} color={color} />;
  if (condition === "Rain" || condition === "Drizzle") return <CloudRain size={size} color={color} />;
  if (condition === "Snow") return <Snowflake size={size} color={color} />;
  if (condition === "Mist" || condition === "Fog") return <Wind size={size} color={color} />;
  return <Cloud size={size} color={color} />;
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
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const isPremium = user?.settings?.isPremium === true;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayWalks = walks.filter((w) => w.startedAt >= todayStart.getTime() && w.endedAt != null);

  const loadWeather = useCallback(async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) return;
      const pos = await getCurrentPosition();
      const w = await fetchWeather(pos.lat, pos.lng);
      setWeather(w);
    } catch { /* optional */ } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { loadWeather(); }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && !weather) { setWeatherLoading(true); loadWeather(); }
    });
    return unsub;
  }, [weather]);

  function handleAddDog() {
    if (!isPremium && dogs.length >= 1) setShowPaywall(true);
    else setShowAddDog(true);
  }

  const activeDogIds = dogs.length === 1 ? [dogs[0].id] : selectedDogIds;
  const activeDogs = dogs.filter((d) => activeDogIds.includes(d.id));

  function startButtonLabel() {
    if (activeDogs.length === 0) return i18n.t("startWalk");
    if (activeDogs.length === 1) return `${activeDogs[0].name}と散歩に行く`;
    return `${activeDogs.map((d) => d.name).join("・")}と散歩に行く`;
  }

  async function doStartWalk(dogIds: string[]) {
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

  async function handleStartWalk() {
    if (activeDogIds.length === 0) {
      Alert.alert(
        i18n.t("selectDogs"),
        "ホーム画面のアイコンをタップして選んでください",
        [{ text: "OK" }]
      );
      return;
    }
    await doStartWalk(activeDogIds);
  }

  const s = makeStyles(colors);

  // マウント直後にフェードイン（天気を待たない）
  const contentOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={s.addBtn} onPress={handleAddDog}>
            <Plus size={18} color={colors.primary} />
            <Text style={[s.addBtnLabel, { color: colors.primary }]}>うちの子を追加</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: contentOpacity }}>
        {/* Dog profile */}
        {dogs.length === 0 ? (
          <View style={s.emptyDog}>
            <View style={s.emptyDogRing}>
              <PawPrint size={40} color={colors.primary} />
            </View>
            <Text style={s.emptyDogText}>{i18n.t("noDogs")}</Text>
          </View>
        ) : dogs.length === 1 ? (
          <View style={s.dogCenter}>
            <View style={[s.dogRing, { borderColor: colors.primary }]}>
              {dogs[0].photoUrl
                ? <Image source={{ uri: dogs[0].photoUrl }} style={s.dogPhoto} />
                : <View style={[s.dogPhotoPlaceholder, { backgroundColor: colors.background }]}><PawPrint size={40} color={colors.primary} /></View>
              }
            </View>
            <Text style={s.dogName}>{dogs[0].name}</Text>
            {!!dogs[0].breed && <Text style={s.dogBreed}>{dogs[0].breed}</Text>}
          </View>
        ) : (
          <View style={s.avatarRow}>
            {dogs.map((dog) => {
              const selected = selectedDogIds.includes(dog.id);
              return (
                <TouchableOpacity key={dog.id} style={s.avatarWrap} onPress={() => toggleDogSelection(dog.id)}>
                  <View style={s.avatarOuter}>
                    <View style={[s.avatarRing, selected && { borderColor: colors.primary }]}>
                      {dog.photoUrl
                        ? <Image source={{ uri: dog.photoUrl }} style={s.avatarImg} />
                        : <View style={s.avatarPlaceholder}><PawPrint size={22} color={colors.primary} /></View>
                      }
                    </View>
                    {selected && <Text style={s.flowerBadge}>🌸</Text>}
                  </View>
                  <Text style={[s.avatarName, selected && { color: colors.primary, fontWeight: "700" }]} numberOfLines={1}>
                    {dog.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Weather card */}
        {weatherLoading ? (
          <View style={[s.weatherCard, { gap: 12 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBox style={{ height: 28, width: 80, borderRadius: 8 }} />
              <SkeletonBox style={{ height: 14, width: 60, borderRadius: 6 }} />
            </View>
            <View style={[s.weatherDivider, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBox style={{ height: 14, width: 70, borderRadius: 6 }} />
              <SkeletonBox style={{ height: 14, width: 100, borderRadius: 6 }} />
            </View>
          </View>
        ) : weather ? (
          <View style={s.weatherCard}>
            <View style={s.weatherLeft}>
              <WeatherIcon condition={weather.condition} size={32} color="#FFB347" />
              <View style={{ marginLeft: 12 }}>
                <Text style={s.weatherTemp}>{Math.round(weather.temp)}°C</Text>
                <Text style={s.weatherCondition}>{weather.condition}</Text>
              </View>
            </View>
            <View style={[s.weatherDivider, { backgroundColor: colors.border }]} />
            <View style={s.weatherRight}>
              {(() => {
                const paw = pawSignal(weather.temp, weather.condition);
                return (
                  <>
                    <PawPrint size={28} color={paw.color} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={s.pawLabel}>Paw Signal</Text>
                      <Text style={[s.pawStatus, { color: paw.color }]}>{paw.label}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        ) : null}

        {/* Today's walks */}
        <Text style={s.sectionTitle}>{i18n.t("todayWalks")}</Text>
        {todayWalks.length === 0 ? (
          <Text style={s.emptyText}>{i18n.t("noWalksToday")}</Text>
        ) : (
          todayWalks.map((walk) => {
            const durationMs = (walk.endedAt ?? Date.now()) - walk.startedAt;
            const mins = Math.floor(durationMs / 60000);
            const distKm = (walk.distanceMeters / 1000).toFixed(2);
            const coords = walk.route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
            const timeStr = new Date(walk.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const walkDogs = dogs.filter((d) => walk.dogIds.includes(d.id));
            const dogNames = walkDogs.map((d) => d.name).join("・");
            const firstDog = walkDogs[0];
            return (
              <TouchableOpacity key={walk.id} style={s.walkCard} onPress={() => navigation.navigate("WalkDetail", { walk })}>
                <View style={s.walkCardHeader}>
                  {/* サムネイル：写真 or 犬アイコン */}
                  {walk.photoUrl ? (
                    <Image source={{ uri: walk.photoUrl }} style={s.walkThumb} />
                  ) : firstDog?.photoUrl ? (
                    <Image source={{ uri: firstDog.photoUrl }} style={s.walkThumb} />
                  ) : (
                    <View style={[s.walkThumbPlaceholder, { backgroundColor: colors.background }]}>
                      <PawPrint size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.walkCardTitle}>{timeStr}</Text>
                    {!!dogNames && <Text style={[s.walkCardDogs, { color: colors.primary }]}>{dogNames}</Text>}
                  </View>
                  <Text style={s.walkChevron}>›</Text>
                </View>
                {walk.photoUrl ? (
                  <Image source={{ uri: walk.photoUrl }} style={s.miniMap} resizeMode="cover" />
                ) : firstDog?.photoUrl ? (
                  <Image source={{ uri: firstDog.photoUrl }} style={s.miniMap} resizeMode="cover" />
                ) : firstDog ? (
                  <View style={[s.miniMapPlaceholder, { backgroundColor: colors.background }]}>
                    <PawPrint size={48} color={colors.primary} />
                    <Text style={[s.miniMapDogName, { color: colors.primary }]}>{firstDog.name}</Text>
                  </View>
                ) : walk.route.length > 1 ? (
                  <MapView
                    style={s.miniMap}
                    initialRegion={routeRegion(walk.route)}
                    scrollEnabled={false} zoomEnabled={false} rotateEnabled={false}
                    pitchEnabled={false} pointerEvents="none"
                  >
                    <Polyline coordinates={coords} strokeColor={colors.primary} strokeWidth={3} />
                  </MapView>
                ) : null}
                <View style={s.walkStats}>
                  <Text style={s.walkStat}>{distKm} km</Text>
                  <Text style={s.walkStatDot}>·</Text>
                  <Text style={s.walkStat}>{mins} {i18n.t("min")}</Text>
                  {(walk.steps ?? 0) > 0 && <>
                    <Text style={s.walkStatDot}>·</Text>
                    <Text style={s.walkStat}>👟 {walk.steps?.toLocaleString()}</Text>
                  </>}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Gradient start button */}
      <View style={s.footer}>
        <TouchableOpacity onPress={handleStartWalk} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={loading ? ["#AAAAAA", "#BBBBBB"] : colors.primaryGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.startBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.startBtnText}>{startButtonLabel()}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddDogModal visible={showAddDog} onClose={() => setShowAddDog(false)} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribed={() => setShowAddDog(true)} />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeStore>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },

    headerRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 20 },
    addBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    addBtnLabel: { fontSize: 13, fontWeight: "600" },

    // Dog - single
    dogCenter: { alignItems: "center", marginBottom: 28 },
    dogRing: {
      width: 130, height: 130, borderRadius: 65, borderWidth: 2.5, overflow: "hidden", marginBottom: 12,
      shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    dogPhoto: { width: "100%", height: "100%" },
    dogPhotoPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
    dogName: { fontSize: 24, fontWeight: "700", color: c.text },
    dogBreed: { fontSize: 14, color: c.textMuted, marginTop: 4 },

    // Dog - empty
    emptyDog: { alignItems: "center", marginBottom: 28 },
    emptyDogRing: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border,
      alignItems: "center", justifyContent: "center", marginBottom: 12,
    },
    emptyDogText: { color: c.textMuted, fontSize: 15 },

    // Dog - multi
    avatarRow: {
      flexDirection: "row", flexWrap: "wrap", gap: 16,
      justifyContent: "center", marginBottom: 24,
    },
    avatarWrap: { alignItems: "center", width: 84 },
    avatarOuter: { width: 68, height: 68, position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 6 },
    flowerBadge: { position: "absolute", top: -4, right: -4, fontSize: 18 },
    avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: c.border, overflow: "hidden" },
    avatarImg: { width: "100%", height: "100%" },
    avatarPlaceholder: { width: "100%", height: "100%", backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    avatarName: { fontSize: 11, color: c.textMuted, textAlign: "center" },

    // Weather
    weatherCard: {
      backgroundColor: c.surface, borderRadius: 24, padding: 20,
      flexDirection: "row", alignItems: "center",
      borderWidth: 1, borderColor: c.border, marginBottom: 28,
    },
    weatherLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
    weatherDivider: { width: 1, height: 44, marginHorizontal: 16 },
    weatherRight: { flex: 1, flexDirection: "row", alignItems: "center" },
    weatherTemp: { fontSize: 24, fontWeight: "700", color: c.text },
    weatherCondition: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    pawLabel: { fontSize: 12, fontWeight: "700", color: c.text },
    pawStatus: { fontSize: 11, fontWeight: "700", marginTop: 2 },

    // Section
    sectionTitle: { fontSize: 17, fontWeight: "700", color: c.text, marginBottom: 14 },
    emptyText: { color: c.textMuted, fontSize: 14, marginBottom: 12 },

    // Walk cards
    walkCard: {
      backgroundColor: c.surface, borderRadius: 24, marginBottom: 14,
      overflow: "hidden", borderWidth: 1, borderColor: c.border,
    },
    walkCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingBottom: 0 },
    walkThumb: { width: 52, height: 52, borderRadius: 14 },
    walkThumbPlaceholder: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    walkCardTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    walkCardDogs: { fontSize: 12, fontWeight: "600", marginTop: 2 },
    walkChevron: { fontSize: 20, color: c.textMuted },
    miniMap: { height: 130, width: "100%", marginTop: 10 },
    miniMapPlaceholder: { height: 130, width: "100%", marginTop: 10, alignItems: "center", justifyContent: "center", gap: 6 },
    miniMapDogName: { fontSize: 14, fontWeight: "700" },
    walkStats: { flexDirection: "row", alignItems: "center", padding: 14, gap: 6 },
    walkStat: { fontSize: 13, fontWeight: "600", color: c.text },
    walkStatDot: { fontSize: 13, color: c.textMuted },

    // Footer
    footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: c.background },
    startBtn: { borderRadius: 30, height: 62, alignItems: "center", justifyContent: "center" },
    startBtnText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  });
}
