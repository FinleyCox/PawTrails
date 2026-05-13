import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Image, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useDogStore } from "../stores/dogStore";
import { updateDogInFirestore } from "../services/firestoreService";
import { uploadDogPhoto } from "../services/storageService";
import { COLORS } from "../constants/theme";
import i18n from "../i18n";
import type { SettingsParamList } from "../../App";
import type { Dog } from "../models/Dog";

type Route = RouteProp<SettingsParamList, "DogEdit">;

export default function DogEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { dog: initialDog } = route.params;
  const { updateDog } = useDogStore();

  const [name, setName] = useState(initialDog.name);
  const [breed, setBreed] = useState(initialDog.breed);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(initialDog.photoUrl);
  const [loading, setLoading] = useState(false);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert(i18n.t("photoPermission")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setCurrentPhotoUrl(undefined); // will be replaced by upload
    }
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert(i18n.t("nameRequired")); return; }
    setLoading(true);
    try {
      let photoUrl = currentPhotoUrl;
      if (photoUri) {
        try { photoUrl = await uploadDogPhoto(photoUri, initialDog.id); } catch { photoUrl = photoUri; }
      }
      const updatedDog: Dog = {
        ...initialDog,
        name: name.trim(),
        breed: breed.trim(),
        photoUrl,
      };
      await updateDogInFirestore(updatedDog);
      updateDog(updatedDog);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  const displayPhoto = photoUri ?? currentPhotoUrl;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoHint}>{i18n.t("selectPhoto")}</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{i18n.t("saveChanges")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: 24, paddingTop: 32 },
  photoPicker: { alignSelf: "center", marginBottom: 28 },
  photoPreview: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  photoIcon: { fontSize: 28 },
  photoHint: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0", color: COLORS.text },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
