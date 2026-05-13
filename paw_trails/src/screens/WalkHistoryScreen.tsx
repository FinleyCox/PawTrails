import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWalkStore } from "../stores/walkStore";
import { useDogStore } from "../stores/dogStore";
import i18n from "../i18n";
import { COLORS } from "../constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WalkHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { walks } = useWalkStore();
  const { dogs } = useDogStore();

  return (
    <View style={styles.container}>
      {walks.length === 0 ? (
        <Text style={styles.empty}>{i18n.t("noWalks")}</Text>
      ) : (
        <FlatList
          data={walks}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => {
            const date = new Date(item.startedAt);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const distKm = (item.distanceMeters / 1000).toFixed(2);
            const durationMs = (item.endedAt ?? Date.now()) - item.startedAt;
            const mins = Math.floor(durationMs / 60000);
            const pooCount = item.events.filter((e) => e.type === "poo").length;
            const peeCount = item.events.filter((e) => e.type === "pee").length;
            const walkDogs = dogs.filter((d) => item.dogIds.includes(d.id));
            const dogNames = walkDogs.map((d) => d.name).join(", ");
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("WalkDetail", { walk: item })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{dateStr} {timeStr}</Text>
                  {!!dogNames && <Text style={styles.dogNames}>🐾 {dogNames}</Text>}
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.stat}>📍 {distKm} km</Text>
                  <Text style={styles.stat}>⏱ {mins} {i18n.t("min")}</Text>
                  {pooCount > 0 && <Text style={styles.stat}>💩 ×{pooCount}</Text>}
                  {peeCount > 0 && <Text style={styles.stat}>💧 ×{peeCount}</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  empty: { color: COLORS.textMuted, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardDate: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  dogNames: { fontSize: 13, color: COLORS.textMuted },
  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  stat: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
});
