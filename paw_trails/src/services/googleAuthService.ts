import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebase";
import { createUserDoc, getUserDoc } from "./firestoreService";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
});

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const idToken = data?.idToken;
  if (!idToken) throw new Error("Google Sign-In failed: no id_token");

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const isNewUser =
    result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
  if (isNewUser) {
    const existing = await getUserDoc(result.user.uid);
    if (!existing) {
      await createUserDoc(
        result.user.uid,
        result.user.displayName ?? "ユーザー"
      );
    }
  }
}
