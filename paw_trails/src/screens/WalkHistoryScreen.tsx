import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
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
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>🐾</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{dateStr} {timeStr}</Text>
                    {!!dogNames && <Text style={styles.dogNames}>🐾 {dogNames}</Text>}
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.stat}>📍 {distKm} km</Text>
                    <Text style={styles.stat}>⏱ {mins} {i18n.t("min")}</Text>
                    {(item.steps ?? 0) > 0 && <Text style={styles.stat}>👟 {item.steps?.toLocaleString()}</Text>}
                    {pooCount > 0 && <Text style={styles.stat}>💩 ×{pooCount}</Text>}
                    {peeCount > 0 && <Text style={styles.stat}>💧 ×{peeCount}</Text>}
                  </View>
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
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  photo: { width: 72, height: 72 },
  photoPlaceholder: {
    width: 72, height: 72,
    backgroundColor: "#F0F0F0",
    alignItems: "center", justifyContent: "center",
  },
  photoPlaceholderText: { fontSize: 28 },
  cardBody: { flex: 1, padding: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardDate: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  dogNames: { fontSize: 12, color: COLORS.textMuted },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  stat: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
});
