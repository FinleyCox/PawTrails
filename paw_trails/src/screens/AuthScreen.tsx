import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { register, login } from "../services/authService";
import { signInWithGoogle } from "../services/googleAuthService";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "register") {
        if (!displayName) { Alert.alert(i18n.t("enterName")); return; }
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>🐾 KithPaw</Text>
      <Text style={styles.modeTitle}>
        {mode === "login" ? i18n.t("login") : i18n.t("register")}
      </Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={async () => {
          setLoading(true);
          try {
            await signInWithGoogle();
          } catch (e: any) {
            Alert.alert(i18n.t("googleLoginError"), e.message);
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        <Text style={styles.googleButtonText}>🔵  {i18n.t("googleLogin")}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{i18n.t("orDivider")}</Text>
        <View style={styles.dividerLine} />
      </View>

      {mode === "register" && (
        <TextInput
          style={styles.input}
          placeholder={i18n.t("namePlaceholder")}
          placeholderTextColor={COLORS.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder={i18n.t("emailPlaceholder")}
        placeholderTextColor={COLORS.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("passwordPlaceholder")}
        placeholderTextColor={COLORS.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleEmailAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "..." : mode === "login" ? i18n.t("login") : i18n.t("createAccount")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <Text style={styles.toggle}>
          {mode === "login" ? i18n.t("noAccount") : i18n.t("alreadyAccount")}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 32,
  },
  logo: { fontSize: 36, textAlign: "center", marginBottom: 12 },
  modeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 28,
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 13 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  toggle: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
