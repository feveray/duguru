import { create } from "zustand";

type ChartState = {
  houseSystem: "P" | "K" | "W" | "E" | "C";
  selectedPlanet: string | null;
  selectedAspect: string | null;
  setHouseSystem: (system: ChartState["houseSystem"]) => void;
  selectPlanet: (planet: string | null) => void;
  selectAspect: (aspect: string | null) => void;
};

/**
 * chartStore — Estado do mapa natal (Zustand).
 *
 * • Não persistido (estado de UI volátil)
 */
export const useChartStore = create<ChartState>()((set) => ({
  houseSystem: "P",
  selectedPlanet: null,
  selectedAspect: null,
  setHouseSystem: (houseSystem) => set({ houseSystem, selectedPlanet: null }),
  selectPlanet: (selectedPlanet) => set({ selectedPlanet, selectedAspect: null }),
  selectAspect: (selectedAspect) => set({ selectedAspect, selectedPlanet: null }),
}));
