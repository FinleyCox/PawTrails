import type { User as FirebaseUser } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";
import { createUserDoc } from "./firestoreService";

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserDoc(cred.user.uid, displayName);
  return cred.user;
}

export async function login(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
