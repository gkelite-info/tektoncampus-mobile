import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Tenant {
  collegeId: number;
  collegeName: string;
  collegeCode: string;
  logoUrl?: string | null;
}

interface TenantState {
  selectedTenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedTenant: null,
      setTenant: (tenant) => set({ selectedTenant: tenant }),
    }),
    {
      name: "tenant-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
