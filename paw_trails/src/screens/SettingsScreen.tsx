import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
  Alert, ScrollView, Share, Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AddDogModal from "../components/AddDogModal";
import PaywallModal from "../components/PaywallModal";
import { useDogStore } from "../stores/dogStore";
import { useUserStore } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import { logout } from "../services/authService";
import { deleteAllUserData, updateUserSettingsFull, deleteDogFromFirestore } from "../services/firestoreService";
import { deleteUser } from "firebase/auth";
import { auth } from "../services/firebase";
import { ThemeKey, themeLabels } from "../constants/theme";
import i18n from "../i18n";
import type { SettingsParamList } from "../../App";

type Nav = NativeStackNavigationProp<SettingsParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setUser, clearUser } = useUserStore();
  const { dogs, removeDog } = useDogStore();
  const { colors, key: themeKey, setTheme } = useThemeStore();
  const [deleting, setDeleting] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [testMultiDog, setTestMultiDog] = useState(false);

  const isPremium = user?.settings?.isPremium === true || testMultiDog;

  function handleDeleteDog(dogId: string, dogName: string) {
    Alert.alert(`${dogName}を削除しますか？`, "この子の登録データが削除されます。", [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: "削除", style: "destructive",
        onPress: async () => {
          try {
            await deleteDogFromFirestore(dogId);
            removeDog(dogId);
          } catch (e: any) {
            Alert.alert(i18n.t("error"), e.message);
          }
        },
      },
    ]);
  }

  async function handleLogout() { await logout(); clearUser(); }

  async function handleShareInviteCode() {
    if (!user?.familyId) return;
    await Share.share({ message: `KithPaw ${i18n.t("shareInviteCode")}: ${user.familyId}` });
  }

  async function handleTogglePrivacyMasking(value: boolean) {
    if (!user) return;
    setUser({ ...user, settings: { ...user.settings, privacyMasking: value } });
    await updateUserSettingsFull(user.id, { privacyMasking: value });
  }

  function handleAddDog() {
    if (!isPremium && dogs.length >= 1) setShowPaywall(true);
    else setShowAddDog(true);
  }

  async function handleDeleteAccount() {
    Alert.alert(i18n.t("deleteAccountTitle"), i18n.t("deleteAccountMsg"), [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("deleteAction"),
        style: "destructive",
        onPress: async () => {
          if (!user?.familyId) return;
          setDeleting(true);
          try {
            await deleteAllUserData(user.id, user.familyId);
            const firebaseUser = auth.currentUser;
            if (firebaseUser) await deleteUser(firebaseUser);
            clearUser();
          } catch (e: any) {
            Alert.alert(i18n.t("error"), e.message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const s = makeStyles(colors);

  return (
    <ScrollView style={s.container}>
      <AddDogModal visible={showAddDog} onClose={() => setShowAddDog(false)} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribed={() => setShowAddDog(true)} />

      {/* Dog management */}
      <Text style={s.section}>{i18n.t("dogManagement")}</Text>
      {dogs.map((dog) => (
        <View key={dog.id} style={s.row}>
          <TouchableOpacity style={s.minusBtn} onPress={() => handleDeleteDog(dog.id, dog.name)}>
            <Text style={s.minusBtnText}>－</Text>
          </TouchableOpacity>
          {dog.photoUrl
            ? <Image source={{ uri: dog.photoUrl }} style={s.dogAvatar} />
            : <View style={s.dogAvatarPlaceholder}><Text style={{ fontSize: 18 }}>🐾</Text></View>
          }
          <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate("DogEdit", { dog })}>
            <Text style={s.rowLabel}>{dog.name}</Text>
            <Text style={s.rowSub}>{dog.breed || i18n.t("breedNotSet")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("DogEdit", { dog })}>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={s.row} onPress={handleAddDog}>
        <Text style={[s.rowLabel, { color: colors.primary }]}>
          ＋ {i18n.t("addDog")}{!isPremium && dogs.length >= 1 ? " 🔒" : ""}
        </Text>
      </TouchableOpacity>

      {/* Theme */}
      <Text style={s.section}>カラーテーマ</Text>
      <View style={s.themeGrid}>
        {(Object.keys(themeLabels) as ThemeKey[]).map((key) => {
          const { label, emoji } = themeLabels[key];
          const active = themeKey === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.themeChip, active && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setTheme(key)}
            >
              <Text style={s.themeEmoji}>{emoji}</Text>
              <Text style={[s.themeLabel, active && { color: colors.primary, fontWeight: "700" }]}>{label}</Text>
              {active && <View style={[s.themeActiveDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Family */}
      <Text style={s.section}>{i18n.t("family")}</Text>
      {user?.familyId ? (
        <>
          <TouchableOpacity style={s.row} onPress={handleShareInviteCode}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{i18n.t("shareInviteCode")}</Text>
              <Text style={s.rowSub} numberOfLines={1}>{user.familyId}</Text>
            </View>
            <Text style={s.rowArrow}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate("FamilySetup")}>
            <Text style={s.rowLabel}>{i18n.t("familySetup")}</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={s.row} onPress={() => navigation.navigate("FamilySetup")}>
          <Text style={[s.rowLabel, { color: colors.primary }]}>{i18n.t("familySetup")}</Text>
          <Text style={s.rowArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Privacy */}
      <Text style={s.section}>{i18n.t("privacySection")}</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>{i18n.t("privacyMaskingLabel")}</Text>
          <Text style={s.rowSub}>{i18n.t("privacyMaskingDesc")}</Text>
        </View>
        <Switch
          value={user?.settings.privacyMasking ?? true}
          onValueChange={handleTogglePrivacyMasking}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Developer */}
      <Text style={s.section}>🛠 開発者テスト</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>複数犬追加を許可</Text>
          <Text style={s.rowSub}>ペイウォールをスキップして複数頭登録できます</Text>
        </View>
        <Switch
          value={testMultiDog}
          onValueChange={setTestMultiDog}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Account */}
      <Text style={s.section}>{i18n.t("accountSection")}</Text>
      <TouchableOpacity style={s.row} onPress={handleLogout}>
        <Text style={s.rowLabel}>{i18n.t("logout")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.row, s.dangerRow]} onPress={handleDeleteAccount} disabled={deleting}>
        <Text style={s.dangerText}>{deleting ? i18n.t("deleting") : i18n.t("deleteAccountLabel")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeStore>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    section: {
      fontSize: 12, fontWeight: "600", color: c.textMuted,
      marginTop: 28, marginBottom: 6, paddingHorizontal: 20,
      textTransform: "uppercase", letterSpacing: 0.8,
    },
    row: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.surface, paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    minusBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.danger, alignItems: "center", justifyContent: "center", marginRight: 10 },
    minusBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 },
    dogAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    dogAvatarPlaceholder: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.background,
      alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    rowLabel: { fontSize: 15, color: c.text },
    rowSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    rowArrow: { color: c.textMuted, fontSize: 20 },
    dangerRow: { backgroundColor: c.surface },
    dangerText: { color: c.danger, fontSize: 15 },

    // Theme grid
    themeGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 10,
      paddingHorizontal: 20, paddingVertical: 16, backgroundColor: c.background,
    },
    themeChip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: c.surface, borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 10,
      borderWidth: 1, borderColor: c.border, position: "relative",
    },
    themeEmoji: { fontSize: 18 },
    themeLabel: { fontSize: 13, color: c.text },
    themeActiveDot: {
      position: "absolute", top: -4, right: -4,
      width: 10, height: 10, borderRadius: 5,
    },
  });
}
