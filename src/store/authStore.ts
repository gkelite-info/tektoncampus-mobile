import { create } from "zustand";

interface User {
  userId: number;
  fullName: string;
  role: string;
  collegeId: number;
}

interface AuthState {
  user: User | null;

  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>(
  (set) => ({
    user: null,

    setUser: (user) =>
      set({ user }),
  })
);