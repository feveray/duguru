import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

/**
 * onboardingStore — Controla o tour de onboarding (Zustand).
 *
 * Sincroniza `isActive: false` via PATCH /api/profile após skip/complete
 * — delegado ao componente OnboardingOverlay (T104).
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      totalSteps: 4,

      start: () => set({ isActive: true, currentStep: 0 }),

      next: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prev: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      skip: () => set({ isActive: false, currentStep: 0 }),
      complete: () => set({ isActive: false, currentStep: 0 }),
    }),
    {
      name: "duguru-onboarding",
    },
  ),
);
