import { create } from "zustand";

import type { ChatPhase, VoicePhase } from "../core/types";

type MascotStore = {
  chatOpen: boolean;
  chatPhase: ChatPhase;
  voiceEnabled: boolean;
  voicePhase: VoicePhase;
  voiceNotice?: string;
  currentConversationId?: string;
  openChat: () => void;
  closeChat: () => void;
  setChatPhase: (phase: ChatPhase) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoicePhase: (phase: VoicePhase) => void;
  setVoiceNotice: (notice?: string) => void;
  setConversationId: (id: string) => void;
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
  setVoiceNotice: (voiceNotice) => set({ voiceNotice }),
  setConversationId: (currentConversationId) => set({ currentConversationId }),
}));
