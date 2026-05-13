import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { COLORS } from "../constants/theme";

type Props = {
  onSkip: () => void;
};

export default function SubscriptionScreen({ onSkip }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.emoji}>🌟</Text>
      <Text style={styles.title}>プレミアムプラン</Text>
      <Text style={styles.subtitle}>複数頭の犬を管理しましょう</Text>

      <View style={styles.featureList}>
        {[
          "🐾  犬を無制限に登録",
          "👨‍👩‍👧  ファミリー共有（最大5人）",
          "📊  詳細な散歩分析",
          "🌡️  地面温度アラート",
        ].map((f) => (
          <Text key={f} style={styles.feature}>{f}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.planButton}>
        <Text style={styles.planPrice}>¥480 / 月</Text>
        <Text style={styles.planLabel}>プレミアムを始める</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>また今度</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: 32, paddingTop: 60, alignItems: "center" },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 40,
  },
  featureList: {
    alignSelf: "stretch",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    gap: 14,
  },
  feature: { fontSize: 15, color: COLORS.text },
  planButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 16,
  },
  planPrice: { color: "#fff", fontSize: 22, fontWeight: "700" },
  planLabel: { color: "#fff", fontSize: 14, marginTop: 2, opacity: 0.9 },
  skipButton: { paddingVertical: 12 },
  skipText: { color: COLORS.textMuted, fontSize: 15 },
});
