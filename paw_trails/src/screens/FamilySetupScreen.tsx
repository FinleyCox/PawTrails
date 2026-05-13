import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { createFamily, joinFamily } from "../services/firestoreService";
import { useUserStore } from "../stores/userStore";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";

export default function FamilySetupScreen() {
  const { user, setUser } = useUserStore();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!familyName || !user) return;
    setLoading(true);
    try {
      const familyId = await createFamily(user.id, familyName);
      setUser({ ...user, familyId });
      Alert.alert(i18n.t("familySetup"), i18n.t("familyHint"));
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode || !user) return;
    setLoading(true);
    try {
      const ok = await joinFamily(user.id, inviteCode.trim());
      if (ok) {
        setUser({ ...user, familyId: inviteCode.trim() });
      } else {
        Alert.alert(i18n.t("invalidInviteCode"));
      }
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "choice") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t("familySetup")}</Text>
        {user?.familyId && (
          <View style={styles.currentFamily}>
            <Text style={styles.currentLabel}>現在のファミリーID</Text>
            <Text style={styles.currentId} numberOfLines={2} selectable>{user.familyId}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={() => setMode("create")}>
          <Text style={styles.buttonText}>{i18n.t("createFamily")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setMode("join")}>
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>{i18n.t("joinFamily")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === "create") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t("createFamily")}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("familyNamePlaceholder")}
          placeholderTextColor={COLORS.textMuted}
          value={familyName}
          onChangeText={setFamilyName}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "..." : i18n.t("createFamilyAction")}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>{i18n.t("familyHint")}</Text>
        <TouchableOpacity onPress={() => setMode("choice")}>
          <Text style={styles.back}>← 戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("joinFamily")}</Text>
      <TextInput
        style={styles.input}
        placeholder="招待コード (Family ID)"
        placeholderTextColor={COLORS.textMuted}
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "..." : i18n.t("joinFamilyAction")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode("choice")}>
        <Text style={styles.back}>← 戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 32, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 24 },
  currentFamily: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  currentLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  currentId: { fontSize: 13, color: COLORS.text, fontFamily: "monospace" },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0", color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginBottom: 12,
  },
  buttonOutline: {
    backgroundColor: "transparent", borderWidth: 2, borderColor: COLORS.primary,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  buttonTextOutline: { color: COLORS.primary },
  hint: { color: COLORS.textMuted, fontSize: 13, marginTop: 8, lineHeight: 20 },
  back: { color: COLORS.primary, marginTop: 20, fontSize: 15, textAlign: "center" },
});
