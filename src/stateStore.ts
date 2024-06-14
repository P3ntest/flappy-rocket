import { create } from "zustand";

interface GameState {
  state: "mainMenu" | "game" | "gameOver";
  setGameState: (state: GameState["state"]) => void;
}

export const useGameState = create<GameState>((set) => ({
  state: "mainMenu",
  setGameState: (state) => set({ state }),
}));
