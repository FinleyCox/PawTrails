import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
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
  visible: boolean;
  onClose: () => void;
};

export default function AddDogModal({ visible, onClose }: Props) {
  const { user } = useUserStore();
  const { addDog } = useDogStore();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setBreed("");
    setPhotoUri(null);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(i18n.t("photoPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(i18n.t("nameRequired"));
      return;
    }
    setLoading(true);
    try {
      const dogId = Crypto.randomUUID();
      let photoUrl: string | undefined;
      if (photoUri) {
        try {
          photoUrl = await uploadDogPhoto(photoUri, dogId);
        } catch {
          // fallback: local URI (won't sync to other devices)
          photoUrl = photoUri;
        }
      }
      const dog = {
        id: dogId,
        familyId: user?.familyId ?? user?.id ?? "",
        name: name.trim(),
        breed: breed.trim(),
        ...(photoUrl ? { photoUrl } : {}),
      };
      await addDogToFirestore(dog);
      addDog(dog);
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert(i18n.t("error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t("addDog")}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
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
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{i18n.t("registerDogAction")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  close: { fontSize: 18, color: COLORS.textMuted, padding: 4 },
  photoPicker: { alignSelf: "center", marginBottom: 20 },
  photoPreview: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: { fontSize: 24 },
  photoHint: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
