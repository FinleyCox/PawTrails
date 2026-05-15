import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Dog } from "../models/Dog";
import { Walk } from "../models/Walk";
import { UserSettings } from "../models/User";
import { maskRouteForPrivacy } from "./privacyService";

// ─── ユーザー ──────────────────────────────────────────────────────────────────

export async function createUserDoc(
  userId: string,
  displayName: string
): Promise<void> {
  // ソロユーザーは userId をそのままファミリーIDとして使う
  await setDoc(doc(db, "families", userId), {
    name: displayName,
    owner: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", userId), {
    displayName,
    familyId: userId,
    settings: { metricSystem: true, privacyMasking: true, language: "ja" },
    createdAt: serverTimestamp(),
  });
}

export async function getUserDoc(userId: string) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  await updateDoc(doc(db, "users", userId), { [`settings.${Object.keys(settings)[0]}`]: Object.values(settings)[0] });
}

export async function updateUserSettingsFull(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(settings)) {
    update[`settings.${k}`] = v;
  }
  await updateDoc(doc(db, "users", userId), update);
}

// ─── ファミリー ────────────────────────────────────────────────────────────────

// 新しいファミリーを作成して familyId をユーザーに紐付け
export async function createFamily(
  userId: string,
  familyName: string
): Promise<string> {
  const ref = await addDoc(collection(db, "families"), {
    name: familyName,
    owner: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", userId), { familyId: ref.id });
  return ref.id;
}

// 招待コード（familyId）でファミリーに参加
export async function joinFamily(
  userId: string,
  familyId: string
): Promise<boolean> {
  const familyRef = doc(db, "families", familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) return false;

  const members: string[] = snap.data().members ?? [];
  if (!members.includes(userId)) {
    await updateDoc(familyRef, { members: [...members, userId] });
  }
  await updateDoc(doc(db, "users", userId), { familyId });
  return true;
}

// ─── 犬 ───────────────────────────────────────────────────────────────────────

export async function addDogToFirestore(dog: Dog): Promise<void> {
  await setDoc(doc(db, "dogs", dog.id), {
    ...dog,
    createdAt: serverTimestamp(),
  });
}

export async function deleteDogFromFirestore(dogId: string): Promise<void> {
  await deleteDoc(doc(db, "dogs", dogId));
}

export async function updateDogInFirestore(dog: Dog): Promise<void> {
  await updateDoc(doc(db, "dogs", dog.id), {
    name: dog.name,
    breed: dog.breed,
    ...(dog.photoUrl !== undefined ? { photoUrl: dog.photoUrl } : {}),
  });
}

// familyId に属する犬をリアルタイム購読
export function subscribeDogs(
  familyId: string,
  callback: (dogs: Dog[]) => void
) {
  const q = query(collection(db, "dogs"), where("familyId", "==", familyId));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      // skip empty cache snapshots — wait for server confirmation before triggering onboarding
      if (snap.metadata.fromCache && snap.docs.length === 0) return;
      const dogs = snap.docs.map((d) => d.data() as Dog);
      callback(dogs);
    },
    (err) => console.error("subscribeDogs error:", err)
  );
}

// ─── 散歩 ─────────────────────────────────────────────────────────────────────

export async function saveWalk(walk: Walk, privacyMasking: boolean): Promise<void> {
  const walkToSave = privacyMasking
    ? { ...walk, route: maskRouteForPrivacy(walk.route) }
    : walk;
  await setDoc(doc(db, "walks", walk.id), {
    ...walkToSave,
    savedAt: serverTimestamp(),
  });
}

// familyId の散歩履歴をリアルタイム購読
export function subscribeWalks(
  familyId: string,
  callback: (walks: Walk[]) => void
) {
  const q = query(collection(db, "walks"), where("familyId", "==", familyId));
  return onSnapshot(q, (snap) => {
    const walks = snap.docs.map((d) => d.data() as Walk);
    // 新しい順に並べる
    walks.sort((a, b) => b.startedAt - a.startedAt);
    callback(walks);
  });
}

export async function deleteWalk(walkId: string): Promise<void> {
  await deleteDoc(doc(db, "walks", walkId));
}

// ─── GDPR：全データ削除 ────────────────────────────────────────────────────────

// ユーザーの全データを Firestore から削除する（退会処理）
// 設計書の「データ削除権」要件
export async function deleteAllUserData(
  userId: string,
  familyId: string
): Promise<void> {
  const batch = writeBatch(db);

  // ユーザードキュメント削除
  batch.delete(doc(db, "users", userId));

  // ユーザーが登録した犬を削除
  const dogsSnap = await getDocs(
    query(collection(db, "dogs"), where("familyId", "==", familyId))
  );
  dogsSnap.docs.forEach((d) => batch.delete(d.ref));

  // ユーザーの散歩記録を削除
  const walksSnap = await getDocs(
    query(collection(db, "walks"), where("walkerId", "==", userId))
  );
  walksSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}
