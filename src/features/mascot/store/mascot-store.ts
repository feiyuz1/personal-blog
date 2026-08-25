import { create } from "zustand";

import type { ChatPhase, MascotPageContext, VoicePhase } from "../core/types";

type MascotStore = {
  chatOpen: boolean;
  chatPhase: ChatPhase;
  voiceEnabled: boolean;
  voicePhase: VoicePhase;
  currentConversationId?: string;
  currentPage?: MascotPageContext;
  openChat: () => void;
  closeChat: () => void;
  setChatPhase: (phase: ChatPhase) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoicePhase: (phase: VoicePhase) => void;
  setConversationId: (id: string) => void;
  setCurrentPage: (page?: MascotPageContext) => void;
};

export const useMascotStore = create<MascotStore>((set) => ({
  chatOpen: false,
  chatPhase: "idle",
  voiceEnabled: false,
  voicePhase: "muted",
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  setChatPhase: (chatPhase) => set({ chatPhase }),
  setVoiceEnabled: (voiceEnabled) =>
    set({
      voiceEnabled,
      voicePhase: voiceEnabled ? "idle" : "muted",
    }),
  setVoicePhase: (voicePhase) => set({ voicePhase }),
  setConversationId: (currentConversationId) => set({ currentConversationId }),
  setCurrentPage: (currentPage) => set({ currentPage }),
}));
