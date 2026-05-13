import { create } from "zustand";
import { Dog } from "../models/Dog";

interface DogState {
  dogs: Dog[];
  selectedDogIds: string[];
  setDogs: (dogs: Dog[]) => void;
  addDog: (dog: Dog) => void;
  updateDog: (dog: Dog) => void;
  toggleDogSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useDogStore = create<DogState>((set) => ({
  dogs: [],
  selectedDogIds: [],
  setDogs: (dogs) => set({ dogs }),
  addDog: (dog) => set((s) => ({ dogs: s.dogs.some((d) => d.id === dog.id) ? s.dogs : [...s.dogs, dog] })),
  updateDog: (dog) => set((s) => ({ dogs: s.dogs.map((d) => (d.id === dog.id ? dog : d)) })),
  toggleDogSelection: (id) =>
    set((s) => ({
      selectedDogIds: s.selectedDogIds.includes(id)
        ? s.selectedDogIds.filter((d) => d !== id)
        : [...s.selectedDogIds, id],
    })),
  clearSelection: () => set({ selectedDogIds: [] }),
}));
