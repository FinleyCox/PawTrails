import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useThemeStore } from "../stores/themeStore";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PhotosScreen() {
  const navigation = useNavigation<Nav>();
  const { walks } = useWalkStore();
  const { colors } = useThemeStore();

  const photoWalks = walks.filter((w) => !!w.photoUrl);

  if (photoWalks.length === 0) {
    return (
      <View style={[s.empty, { backgroundColor: colors.background }]}>
        <Text style={s.emptyIcon}>📷</Text>
        <Text style={[s.emptyText, { color: colors.textMuted }]}>散歩の写真がまだありません</Text>
        <Text style={[s.emptySub, { color: colors.textMuted }]}>散歩中に📷ボタンで撮影できます</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photoWalks}
      numColumns={2}
      keyExtractor={(w) => w.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      columnWrapperStyle={{ gap: 10 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const date = new Date(item.startedAt);
        const dateStr = date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const distKm = (item.distanceMeters / 1000).toFixed(2);
        return (
          <TouchableOpacity
            style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate("WalkDetail", { walk: item })}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.photoUrl! }} style={s.photo} resizeMode="cover" />
            <View style={s.info}>
              <Text style={[s.date, { color: colors.text }]}>{dateStr}</Text>
              <Text style={[s.sub, { color: colors.textMuted }]}>{timeStr}  📍{distKm}km</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },
  card: { flex: 1, borderRadius: 20, overflow: "hidden", borderWidth: 1 },
  photo: { width: "100%", aspectRatio: 1 },
  info: { padding: 10 },
  date: { fontSize: 13, fontWeight: "700" },
  sub: { fontSize: 11, marginTop: 2 },
});
