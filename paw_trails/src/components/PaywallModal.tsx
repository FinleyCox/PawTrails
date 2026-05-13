import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";
import { useUserStore } from "../stores/userStore";
import { updateUserSettingsFull } from "../services/firestoreService";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
};

export default function PaywallModal({ visible, onClose, onSubscribed }: Props) {
  const { user, setUser } = useUserStore();

  async function handleSubscribe() {
    if (!user) return;
    // TODO: replace with real IAP (RevenueCat / Expo In-App Purchases)
    const updated = { ...user, settings: { ...user.settings, isPremium: true } };
    setUser(updated);
    await updateUserSettingsFull(user.id, { isPremium: true });
    onSubscribed?.();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.emoji}>🌟</Text>
          <Text style={styles.title}>{i18n.t("premiumTitle")}</Text>
          <Text style={styles.subtitle}>{i18n.t("premiumSubtitle")}</Text>

          <View style={styles.featureList}>
            {(["premiumFeature1", "premiumFeature2", "premiumFeature3", "premiumFeature4"] as const).map((k) => (
              <Text key={k} style={styles.feature}>{i18n.t(k)}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.planButton} onPress={handleSubscribe}>
            <Text style={styles.planPrice}>{i18n.t("premiumPrice")}</Text>
            <Text style={styles.planLabel}>{i18n.t("premiumStart")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipText}>{i18n.t("maybeNextTime")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    alignItems: "center",
  },
  closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 8 },
  closeText: { fontSize: 18, color: COLORS.textMuted },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: 24 },
  featureList: {
    alignSelf: "stretch",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 12,
  },
  feature: { fontSize: 15, color: COLORS.text },
  planButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 12,
  },
  planPrice: { color: "#fff", fontSize: 20, fontWeight: "700" },
  planLabel: { color: "#fff", fontSize: 13, marginTop: 2, opacity: 0.9 },
  skipButton: { paddingVertical: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14 },
});
