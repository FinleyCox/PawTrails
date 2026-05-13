import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Image, ActivityIndicator,
} from "react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "../stores/userStore";
import { useDogStore } from "../stores/dogStore";
import { addDogToFirestore } from "../services/firestoreService";
import { uploadDogPhoto } from "../services/storageService";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";

type Props = {
  onDone: () => void;
  onAddMore: () => void;
};

export default function DogOnboardingScreen({ onDone, onAddMore }: Props) {
  const { user } = useUserStore();
  const { addDog } = useDogStore();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert(i18n.t("photoPermission")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert(i18n.t("nameRequired")); return; }
    setLoading(true);
    try {
      const dogId = Crypto.randomUUID();
      let photoUrl: string | undefined;
      if (photoUri) {
        try { photoUrl = await uploadDogPhoto(photoUri, dogId); } catch { photoUrl = photoUri; }
      }
      const dog = {
        id: dogId,
        familyId: user!.familyId ?? user!.id,
        name: name.trim(),
        breed: breed.trim(),
        ...(photoUrl ? { photoUrl } : {}),
      };
      await addDogToFirestore(dog);
      addDog(dog);
      Alert.alert(
        i18n.t("dogRegistered", { name: dog.name }),
        i18n.t("addAnotherDog"),
        [
          { text: i18n.t("maybeNextTime"), onPress: onDone },
          { text: i18n.t("addMore"), onPress: onAddMore },
        ]
      );
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>{i18n.t("registerDogTitle")}</Text>
        <Text style={styles.subtitle}>{i18n.t("registerDogSubtitle")}</Text>

        <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoHint}>{i18n.t("addPhotoOptional")}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>{i18n.t("dogName")}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("dogNamePlaceholder")}
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>{i18n.t("dogBreed")}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("dogBreedPlaceholder")}
          placeholderTextColor={COLORS.textMuted}
          value={breed}
          onChangeText={setBreed}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{i18n.t("registerDogAction")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: 32, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: 32, lineHeight: 22 },
  photoPicker: { alignSelf: "center", marginBottom: 32 },
  photoPreview: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: "#E2E8F0",
    borderStyle: "dashed", alignItems: "center", justifyContent: "center",
  },
  photoIcon: { fontSize: 28 },
  photoHint: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0", color: COLORS.text },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
