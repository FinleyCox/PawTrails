import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

async function uploadPhoto(localUri: string, storagePath: string): Promise<string> {
  const storage = getStorage(app);
  const storageRef = ref(storage, storagePath);

  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("XHR blob conversion failed"));
    xhr.responseType = "blob";
    xhr.open("GET", localUri, true);
    xhr.send(null);
  });

  const snapshot = await uploadBytesResumable(storageRef, blob);
  return getDownloadURL(snapshot.ref);
}

export async function uploadDogPhoto(localUri: string, dogId: string): Promise<string> {
  return uploadPhoto(localUri, `dogs/${dogId}/photo.jpg`);
}

export async function uploadWalkPhoto(localUri: string, walkId: string): Promise<string> {
  return uploadPhoto(localUri, `walks/${walkId}/photo.jpg`);
}
