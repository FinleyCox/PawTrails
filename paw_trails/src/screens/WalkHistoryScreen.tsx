import React, { memo, useEffect, useRef, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";
import SkeletonBox from "../components/SkeletonBox";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useDogStore } from "../stores/dogStore";
import { useUserStore } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import i18n from "../i18n";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import type { Walk } from "../models/Walk";
import type { Dog } from "../models/Dog";
import type { Theme } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WalkHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { walks } = useWalkStore();
  const { dogs } = useDogStore();
  const { user } = useUserStore();
  const { colors } = useThemeStore();
  const s = makeStyles(colors);

  // 初回ロード判定：walks が空でも一瞬スケルトンを出す
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // フェードイン
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!initialLoad) {
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [initialLoad]);

  const isPremium = user?.settings?.isPremium === true;

  // 無料ユーザーは今月 + 先月のみ表示
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const visibleWalks = isPremium ? walks : walks.filter((w) => w.startedAt >= twoMonthsAgo);

  // 年月でグルーピング
  const groupedMap = new Map<string, { title: string; data: Walk[] }>();
  for (const walk of visibleWalks) {
    const d = new Date(walk.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const title = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!groupedMap.has(key)) groupedMap.set(key, { title, data: [] });
    groupedMap.get(key)!.data.push(walk);
  }
  const sections = Array.from(groupedMap.values());

  const lockedCount = walks.length - visibleWalks.length;

  if (initialLoad) {
    return (
      <View style={[s.container, { padding: 20, gap: 12 }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.card, { overflow: "hidden" }]}>
            <SkeletonBox style={{ width: 80, height: 80 }} />
            <View style={{ flex: 1, padding: 12, gap: 8 }}>
              <SkeletonBox style={{ height: 14, width: "60%", borderRadius: 7 }} />
              <SkeletonBox style={{ height: 11, width: "40%", borderRadius: 6 }} />
              <View style={{ flexDirection: "row", gap: 6 }}>
                <SkeletonBox style={{ height: 22, width: 60, borderRadius: 10 }} />
                <SkeletonBox style={{ height: 22, width: 50, borderRadius: 10 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (walks.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyEmoji}>🗺️</Text>
        <Text style={s.emptyText}>{i18n.t("noWalks")}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[s.container, { opacity }]}>
      <SectionList
        sections={sections}
        keyExtractor={(w) => w.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={s.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => <WalkCard walk={item} dogs={dogs} colors={colors} s={s} navigation={navigation} />}
        ListFooterComponent={
          !isPremium && lockedCount > 0 ? (
            <View style={s.premiumBanner}>
              <Text style={s.premiumIcon}>🔒</Text>
              <Text style={s.premiumText}>{lockedCount}件の過去の記録があります</Text>
              <Text style={s.premiumSub}>プレミアムで全履歴を閲覧できます</Text>
            </View>
          ) : null
        }
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={10}
      />
    </Animated.View>
  );
}

const WalkCard = memo(function WalkCard({ walk, dogs, colors, s, navigation }: {
  walk: Walk;
  dogs: Dog[];
  colors: Theme;
  s: ReturnType<typeof makeStyles>;
  navigation: Nav;
}) {
  const date = new Date(walk.startedAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const distKm = (walk.distanceMeters / 1000).toFixed(2);
  const durationMs = (walk.endedAt ?? Date.now()) - walk.startedAt;
  const mins = Math.floor(durationMs / 60000);
  const pooCount = walk.events.filter((e) => e.type === "poo").length;
  const peeCount = walk.events.filter((e) => e.type === "pee").length;
  const walkDogs = dogs.filter((d) => walk.dogIds.includes(d.id));
  const dogNames = walkDogs.map((d) => d.name).join("・");

  return (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate("WalkDetail", { walk })}>
      {walk.photoUrl
        ? <Image source={{ uri: walk.photoUrl }} style={s.photo} />
        : <View style={s.photoPlaceholder}><Text style={s.photoPlaceholderText}>🐾</Text></View>
      }
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardDate}>{dateStr}</Text>
          <Text style={s.cardTime}>{timeStr}</Text>
        </View>
        {!!dogNames && <Text style={[s.dogNames, { color: colors.primary }]}>{dogNames}</Text>}
        <View style={s.statsRow}>
          <Chip label={`📍 ${distKm} km`} bg={colors.background} text={colors.text} />
          <Chip label={`⏱ ${mins}${i18n.t("min")}`} bg={colors.background} text={colors.text} />
          {(walk.steps ?? 0) > 0 && <Chip label={`👟 ${(walk.steps ?? 0).toLocaleString()}`} bg={colors.background} text={colors.text} />}
          {pooCount > 0 && <Chip label={`💩 ×${pooCount}`} bg={colors.background} text={colors.text} />}
          {peeCount > 0 && <Chip label={`💧 ×${peeCount}`} bg={colors.background} text={colors.text} />}
        </View>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
});

function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <View style={[chipS.chip, { backgroundColor: bg }]}>
      <Text style={[chipS.text, { color: text }]}>{label}</Text>
    </View>
  );
}
const chipS = StyleSheet.create({
  chip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: "600" },
});

function makeStyles(c: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { padding: 20, paddingBottom: 40 },
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: c.textMuted, fontSize: 16 },
    sectionHeader: {
      fontSize: 13, fontWeight: "700", color: c.textMuted,
      marginTop: 20, marginBottom: 10, letterSpacing: 0.5,
    },
    card: {
      backgroundColor: c.surface, borderRadius: 24, marginBottom: 12,
      flexDirection: "row", alignItems: "center",
      borderWidth: 1, borderColor: c.border, overflow: "hidden",
    },
    photo: { width: 80, height: 80 },
    photoPlaceholder: { width: 80, height: 80, backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    photoPlaceholderText: { fontSize: 30 },
    cardBody: { flex: 1, padding: 12 },
    cardTop: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 2 },
    cardDate: { fontSize: 14, fontWeight: "700", color: c.text },
    cardTime: { fontSize: 12, color: c.textMuted },
    dogNames: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
    statsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    chevron: { fontSize: 22, color: c.textMuted, paddingRight: 14 },
    premiumBanner: {
      marginTop: 24, padding: 20, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      alignItems: "center", gap: 6,
    },
    premiumIcon: { fontSize: 28 },
    premiumText: { fontSize: 14, fontWeight: "700", color: c.text },
    premiumSub: { fontSize: 12, color: c.textMuted },
  });
}
