import { create } from "zustand"

type PaletteState = {
  open: boolean
  setOpen: (open: boolean) => void
}

// Open state for the command palette. Lives outside React so the top-bar
// search button can open it without prop drilling.
export const usePaletteStore = create<PaletteState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
