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
import { logout } from "../services/authService";
import { deleteAllUserData, updateUserSettingsFull } from "../services/firestoreService";
import { deleteUser } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";
import type { SettingsParamList } from "../../App";

type Nav = NativeStackNavigationProp<SettingsParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setUser, clearUser } = useUserStore();
  const { dogs } = useDogStore();
  const [deleting, setDeleting] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = user?.settings?.isPremium === true;

  async function handleLogout() {
    await logout();
    clearUser();
  }

  async function handleShareInviteCode() {
    if (!user?.familyId) return;
    await Share.share({
      message: `KithPaw ${i18n.t("shareInviteCode")}: ${user.familyId}`,
    });
  }

  async function handleTogglePrivacyMasking(value: boolean) {
    if (!user) return;
    const updated = { ...user, settings: { ...user.settings, privacyMasking: value } };
    setUser(updated);
    await updateUserSettingsFull(user.id, { privacyMasking: value });
  }

  function handleAddDog() {
    if (!isPremium && dogs.length >= 1) {
      setShowPaywall(true);
    } else {
      setShowAddDog(true);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      i18n.t("deleteAccountTitle"),
      i18n.t("deleteAccountMsg"),
      [
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
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <AddDogModal visible={showAddDog} onClose={() => setShowAddDog(false)} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribed={() => setShowAddDog(true)} />

      {/* Dog management */}
      <Text style={styles.section}>{i18n.t("dogManagement")}</Text>
      {dogs.map((dog) => (
        <TouchableOpacity
          key={dog.id}
          style={styles.row}
          onPress={() => navigation.navigate("DogEdit", { dog })}
        >
          {dog.photoUrl ? (
            <Image source={{ uri: dog.photoUrl }} style={styles.dogAvatar} />
          ) : (
            <View style={styles.dogAvatarPlaceholder}><Text style={{ fontSize: 18 }}>🐾</Text></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{dog.name}</Text>
            <Text style={styles.rowSub}>{dog.breed || i18n.t("breedNotSet")}</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.row} onPress={handleAddDog}>
        <Text style={[styles.rowLabel, { color: COLORS.primary }]}>
          ＋ {i18n.t("addDog")}
          {!isPremium && dogs.length >= 1 ? " 🔒" : ""}
        </Text>
      </TouchableOpacity>

      {/* Family */}
      <Text style={styles.section}>{i18n.t("family")}</Text>
      {user?.familyId ? (
        <>
          <TouchableOpacity style={styles.row} onPress={handleShareInviteCode}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{i18n.t("shareInviteCode")}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{user.familyId}</Text>
            </View>
            <Text style={styles.rowArrow}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("FamilySetup")}>
            <Text style={styles.rowLabel}>{i18n.t("familySetup")}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("FamilySetup")}>
          <Text style={[styles.rowLabel, { color: COLORS.primary }]}>{i18n.t("familySetup")}</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Privacy */}
      <Text style={styles.section}>{i18n.t("privacySection")}</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{i18n.t("privacyMaskingLabel")}</Text>
          <Text style={styles.rowSub}>{i18n.t("privacyMaskingDesc")}</Text>
        </View>
        <Switch
          value={user?.settings.privacyMasking ?? true}
          onValueChange={handleTogglePrivacyMasking}
          trackColor={{ true: COLORS.primary }}
        />
      </View>

      {/* Account */}
      <Text style={styles.section}>{i18n.t("accountSection")}</Text>
      <TouchableOpacity style={styles.row} onPress={handleLogout}>
        <Text style={styles.rowLabel}>{i18n.t("logout")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, styles.dangerRow]}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        <Text style={styles.dangerText}>
          {deleting ? i18n.t("deleting") : i18n.t("deleteAccountLabel")}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: {
    fontSize: 12, fontWeight: "600", color: COLORS.textMuted,
    marginTop: 24, marginBottom: 4, paddingHorizontal: 16,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.surface, padding: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  dogAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  dogAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0F0",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  rowLabel: { fontSize: 15, color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rowArrow: { color: COLORS.textMuted, fontSize: 20 },
  dangerRow: { backgroundColor: "#FFF5F5" },
  dangerText: { color: COLORS.danger, fontSize: 15 },
});
