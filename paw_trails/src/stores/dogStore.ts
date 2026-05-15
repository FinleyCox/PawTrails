import { create } from "zustand";
import { Dog } from "../models/Dog";

interface DogState {
  dogs: Dog[];
  selectedDogIds: string[];
  setDogs: (dogs: Dog[]) => void;
  addDog: (dog: Dog) => void;
  updateDog: (dog: Dog) => void;
  removeDog: (id: string) => void;
  toggleDogSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useDogStore = create<DogState>((set) => ({
  dogs: [],
  selectedDogIds: [],
  setDogs: (dogs) => set((s) => ({
    dogs,
    // 全犬をデフォルト選択。既存の選択がある犬はそのまま、新しく追加された犬は選択状態にする
    selectedDogIds: dogs.map((d) => d.id).filter((id) =>
      s.selectedDogIds.length === 0 || s.selectedDogIds.includes(id) || !s.dogs.some((d) => d.id === id)
    ),
  })),
  addDog: (dog) => set((s) => ({ dogs: s.dogs.some((d) => d.id === dog.id) ? s.dogs : [...s.dogs, dog] })),
  updateDog: (dog) => set((s) => ({ dogs: s.dogs.map((d) => (d.id === dog.id ? dog : d)) })),
  removeDog: (id) => set((s) => ({ dogs: s.dogs.filter((d) => d.id !== id), selectedDogIds: s.selectedDogIds.filter((sid) => sid !== id) })),
  toggleDogSelection: (id) =>
    set((s) => ({
      selectedDogIds: s.selectedDogIds.includes(id)
        ? s.selectedDogIds.filter((d) => d !== id)
        : [...s.selectedDogIds, id],
    })),
  clearSelection: () => set({ selectedDogIds: [] }),
}));
