"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MascotAudioPlayer } from "../audio/player";
import {
  getMascotInteractionVoice,
  isMascotInteractionVoiceId,
} from "../core/interaction-voices";
import type { MascotFeatureConfig, MascotHostContext } from "../core/types";
import { CurrentLive2DAdapter } from "../live2d";
import { useMascotStore } from "../store/mascot-store";
import { MascotChat } from "./MascotChat";
import { useMascotPlacement } from "./use-mascot-placement";

export function MascotRoot({
  hostContext,
  features,
}: {
  hostContext: MascotHostContext;
  features: MascotFeatureConfig;
}) {
  const chatOpen = useMascotStore((state) => state.chatOpen);
  const chatPhase = useMascotStore((state) => state.chatPhase);
  const voiceEnabled = useMascotStore((state) => state.voiceEnabled);
  const voicePhase = useMascotStore((state) => state.voicePhase);
  const openChat = useMascotStore((state) => state.openChat);
  const closeChat = useMascotStore((state) => state.closeChat);
  const setChatPhase = useMascotStore((state) => state.setChatPhase);
  const setVoiceEnabled = useMascotStore((state) => state.setVoiceEnabled);
  const setCurrentPage = useMascotStore((state) => state.setCurrentPage);
  const placement = useMascotPlacement();
  const chatTriggerRef = useRef<HTMLButtonElement>(null);
  const chatWasOpen = useRef(false);
  const interactionVoiceRun = useRef(0);
  const [petChatControlAvailable, setPetChatControlAvailable] = useState(false);
  const [interactionVoiceActive, setInteractionVoiceActive] = useState(false);

  const live2dAdapter = useMemo(() => new CurrentLive2DAdapter(), []);
  const audioPlayer = useMemo(
    () =>
      new MascotAudioPlayer({
        adapter: live2dAdapter,
        maxSegmentChars: features.ttsMaxChars,
        onPhaseChange: (phase) =>
          useMascotStore.getState().setVoicePhase(phase),
      }),
    [features.ttsMaxChars, live2dAdapter],
  );

  useEffect(() => {
    live2dAdapter.connect();
    return () => {
      audioPlayer.dispose();
      live2dAdapter.dispose();
    };
  }, [audioPlayer, live2dAdapter]);

  useEffect(() => {
    setCurrentPage(hostContext.page);
  }, [hostContext.page, setCurrentPage]);

  useEffect(() => {
    let enabled = false;
    if (features.ttsEnabled && features.ttsConfigured) {
      try {
        enabled = localStorage.getItem("mascot.voiceEnabled") === "true";
      } catch {
        enabled = false;
      }
    }
    setVoiceEnabled(enabled);
  }, [features.ttsConfigured, features.ttsEnabled, setVoiceEnabled]);

  useEffect(() => {
    const syncPetChatControl = () => {
      const controls = document.querySelectorAll<HTMLElement>(
        "[data-mascot-chat-control]",
      );
      controls.forEach((control) =>
        control.setAttribute(
          "aria-expanded",
          String(useMascotStore.getState().chatOpen),
        ),
      );
      setPetChatControlAvailable(controls.length > 0);
    };
    const observer = new MutationObserver(syncPetChatControl);
    observer.observe(document.body, { childList: true, subtree: true });
    syncPetChatControl();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handlePetChatControl = () => openChat();
    window.addEventListener("mascot:open-chat", handlePetChatControl);
    return () =>
      window.removeEventListener("mascot:open-chat", handlePetChatControl);
  }, [openChat]);

  useEffect(() => {
    if (!voiceEnabled || !features.ttsEnabled || !features.ttsConfigured) {
      return;
    }

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData || document.visibilityState === "hidden") return;

    let cancelled = false;
    const preload = () => {
      if (!cancelled) void audioPlayer.preloadInteractionVoices();
    };
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(preload);
      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(preload, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [audioPlayer, features.ttsConfigured, features.ttsEnabled, voiceEnabled]);

  useEffect(() => {
    let disposed = false;

    const handleInteractionVoice = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (!isMascotInteractionVoiceId(id)) return;

      live2dAdapter.triggerExpression(getMascotInteractionVoice(id).expression);
      if (
        !useMascotStore.getState().voiceEnabled ||
        !features.ttsEnabled ||
        !features.ttsConfigured
      ) {
        return;
      }

      const runId = ++interactionVoiceRun.current;
      setInteractionVoiceActive(true);
      void audioPlayer
        .speakInteraction(id)
        .catch(() => {
          console.warn("Mascot interaction voice could not be played.");
        })
        .finally(() => {
          if (!disposed && runId === interactionVoiceRun.current) {
            setInteractionVoiceActive(false);
          }
        });
    };

    window.addEventListener("mascot:interaction-voice", handleInteractionVoice);
    return () => {
      disposed = true;
      interactionVoiceRun.current += 1;
      window.removeEventListener(
        "mascot:interaction-voice",
        handleInteractionVoice,
      );
    };
  }, [audioPlayer, features.ttsConfigured, features.ttsEnabled, live2dAdapter]);

  useEffect(() => {
    document.body.dataset.mascotChatOpen = String(chatOpen);
    document
      .querySelectorAll<HTMLElement>("[data-mascot-chat-control]")
      .forEach((control) =>
        control.setAttribute("aria-expanded", String(chatOpen)),
      );
    if (chatOpen) {
      chatWasOpen.current = true;
    } else if (chatWasOpen.current) {
      chatWasOpen.current = false;
      window.requestAnimationFrame(() => {
        const petControl = document.querySelector<HTMLElement>(
          "[data-mascot-chat-control]",
        );
        (petControl ?? chatTriggerRef.current)?.focus();
      });
    }
    return () => {
      delete document.body.dataset.mascotChatOpen;
    };
  }, [chatOpen]);

  useEffect(() => {
    if (interactionVoiceActive) return;
    if (voicePhase === "speaking") {
      live2dAdapter.setState("speaking");
    } else if (chatPhase === "error" || voicePhase === "error") {
      live2dAdapter.setState("error");
    } else if (
      chatPhase === "thinking" ||
      chatPhase === "streaming" ||
      voicePhase === "loading"
    ) {
      live2dAdapter.setState("thinking");
    } else {
      live2dAdapter.setState("idle");
    }
  }, [chatPhase, interactionVoiceActive, live2dAdapter, voicePhase]);

  const close = () => {
    audioPlayer.stop();
    setChatPhase("idle");
    closeChat();
  };

  return (
    <div data-mascot-root>
      {!petChatControlAvailable ? (
        <button
          ref={chatTriggerRef}
          type="button"
          onClick={openChat}
          style={
            placement
              ? {
                  left: placement.trigger.left,
                  top: placement.trigger.top,
                  right: "auto",
                  bottom: "auto",
                }
              : undefined
          }
          className={`mascot-chat-trigger fixed right-4 bottom-4 z-50 inline-flex h-11 items-center gap-2 rounded-full border border-emerald-950/10 bg-[#fffdf8]/95 px-4 text-sm font-medium text-emerald-900 shadow-[0_12px_30px_rgba(34,58,45,0.2)] transition outline-none hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-slate-900/95 dark:text-emerald-200 dark:hover:bg-slate-800 ${
            chatOpen ? "pointer-events-none invisible opacity-0" : "opacity-100"
          }`}
          aria-label={`打开与${features.mascotName}的聊天`}
          aria-expanded={chatOpen}
          aria-controls="mascot-chat-dialog"
          aria-hidden={chatOpen}
          tabIndex={chatOpen ? -1 : 0}
          title="聊天"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
          </svg>
          <span>聊天</span>
        </button>
      ) : null}
      <MascotChat
        open={chatOpen}
        desktopPosition={placement?.chat}
        hostContext={hostContext}
        features={features}
        audioPlayer={audioPlayer}
        onClose={close}
      />
    </div>
  );
}
