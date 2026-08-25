"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { MascotAudioPlayer } from "../audio/player";
import type { MascotFeatureConfig, MascotHostContext } from "../core/types";
import { useMascotStore } from "../store/mascot-store";
import { MascotInput } from "./MascotInput";
import { MascotMessage, type DisplayMascotMessage } from "./MascotMessage";
import { MascotSuggestions } from "./MascotSuggestions";
import { MemoryButton } from "./MemoryButton";
import { VoiceButton } from "./VoiceButton";

const FRIENDLY_AI_ERROR = "唔，好像没接上信号……稍后再找我试试吧。";
const STREAM_IDLE_TIMEOUT_MS = 20_000;
const STREAM_TIMEOUT_MESSAGE = "等了有点久，连接已经自动断开，请再试一次。";

class MascotResponseError extends Error {}

function voiceErrorMessage(error: unknown) {
  const notice =
    error instanceof Error ? error.message : "语音暂时不可用，请稍后再试。";
  return notice.includes("文字回答不受影响")
    ? notice
    : `${notice} 文字回答不受影响。`;
}

function messageId() {
  return crypto.randomUUID();
}

function buildRecentHistory(
  messages: DisplayMascotMessage[],
  features: Pick<MascotFeatureConfig, "historyTurns" | "maxHistoryChars">,
) {
  const candidates = messages.filter(
    (message) =>
      message.id !== "mascot-welcome" && message.content && !message.error,
  );
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  let characters = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const message = candidates[index];
    if (!message || history.length >= features.historyTurns * 2) break;
    if (characters + message.content.length > features.maxHistoryChars) break;
    history.unshift({ role: message.role, content: message.content });
    characters += message.content.length;
  }

  return history;
}

async function responseErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : FRIENDLY_AI_ERROR;
  } catch {
    return FRIENDLY_AI_ERROR;
  }
}

export function MascotChat({
  open,
  desktopPosition,
  hostContext,
  features,
  audioPlayer,
  onClose,
}: {
  open: boolean;
  desktopPosition?: { left: number; top: number };
  hostContext: MascotHostContext;
  features: MascotFeatureConfig;
  audioPlayer: MascotAudioPlayer;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DisplayMascotMessage[]>([
    {
      id: "mascot-welcome",
      role: "assistant",
      content: "今天想聊点什么？技术问题、当前页面，或者随便聊聊都可以。",
    },
  ]);
  const [memoryNoticeOpen, setMemoryNoticeOpen] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string>();
  const abortController = useRef<AbortController | null>(null);
  const activeAssistantId = useRef<string | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const scrollAnchor = useRef<HTMLDivElement | null>(null);

  const chatPhase = useMascotStore((state) => state.chatPhase);
  const voiceEnabled = useMascotStore((state) => state.voiceEnabled);
  const voicePhase = useMascotStore((state) => state.voicePhase);
  const conversationId = useMascotStore((state) => state.currentConversationId);
  const setChatPhase = useMascotStore((state) => state.setChatPhase);
  const setVoiceEnabled = useMascotStore((state) => state.setVoiceEnabled);
  const setVoicePhase = useMascotStore((state) => state.setVoicePhase);
  const setConversationId = useMascotStore((state) => state.setConversationId);
  const generating = chatPhase === "thinking" || chatPhase === "streaming";
  const voiceAvailable =
    features.ttsEnabled && features.ttsConfigured && features.aiEnabled;

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ block: "end" });
  }, [messages, open, chatPhase, memoryNoticeOpen, voiceNotice]);

  useEffect(() => {
    if (open) return;
    abortController.current?.abort();
    abortController.current = null;
    activeAssistantId.current = null;
    audioPlayer.stop();
    setChatPhase("idle");
  }, [audioPlayer, open, setChatPhase]);

  useEffect(() => {
    if (!open) return;
    const frameId = window.requestAnimationFrame(() =>
      closeButton.current?.focus(),
    );
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    if (
      (chatPhase === "thinking" || chatPhase === "streaming") &&
      !abortController.current
    ) {
      setChatPhase("idle");
    }
  }, [chatPhase, setChatPhase]);

  useEffect(
    () => () => {
      abortController.current?.abort();
      audioPlayer.stop();
    },
    [audioPlayer],
  );

  const replaceAssistant = (id: string, content: string, error = false) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, content, error } : message,
      ),
    );
  };

  const removeAssistantIfEmpty = (id: string) => {
    setMessages((current) =>
      current.filter((message) => message.id !== id || message.content),
    );
  };

  const send = async (selectedPrompt?: string) => {
    const text = (selectedPrompt ?? input).trim();
    if (!text || generating || !features.aiEnabled || !features.aiConfigured) {
      return;
    }

    audioPlayer.stop();
    setVoiceNotice(undefined);
    if (voiceEnabled) {
      setVoicePhase("idle");
      void audioPlayer
        .unlock()
        .catch((error) => setVoiceNotice(voiceErrorMessage(error)));
    }

    const userMessage: DisplayMascotMessage = {
      id: messageId(),
      role: "user",
      content: text,
    };
    const assistantId = messageId();
    const history = buildRecentHistory(messages, features);
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setChatPhase("thinking");

    const controller = new AbortController();
    abortController.current = controller;
    activeAssistantId.current = assistantId;
    const activeConversationId = conversationId ?? crypto.randomUUID();
    if (!conversationId) setConversationId(activeConversationId);

    let completeText = "";
    let streamTimedOut = false;
    let streamTimeoutId: number | undefined;
    const clearStreamTimeout = () => {
      if (streamTimeoutId !== undefined) {
        window.clearTimeout(streamTimeoutId);
        streamTimeoutId = undefined;
      }
    };
    const armStreamTimeout = () => {
      clearStreamTimeout();
      streamTimeoutId = window.setTimeout(() => {
        streamTimedOut = true;
        controller.abort();
      }, STREAM_IDLE_TIMEOUT_MS);
    };
    const isCurrentRequest = () => abortController.current === controller;

    armStreamTimeout();
    try {
      const response = await fetch("/api/mascot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: text,
          history,
          page: hostContext.page,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new MascotResponseError(await responseErrorMessage(response));
      }
      if (!response.body) throw new Error(FRIENDLY_AI_ERROR);

      const responseConversationId = response.headers.get(
        "x-mascot-conversation-id",
      );
      if (responseConversationId) setConversationId(responseConversationId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedFirstChunk = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        armStreamTimeout();
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        completeText += chunk;
        if (!receivedFirstChunk && isCurrentRequest()) {
          receivedFirstChunk = true;
          setChatPhase("streaming");
        }
        replaceAssistant(assistantId, completeText);
      }
      clearStreamTimeout();
      completeText += decoder.decode();
      if (!completeText.trim()) throw new Error(FRIENDLY_AI_ERROR);
      replaceAssistant(assistantId, completeText);
      if (isCurrentRequest()) setChatPhase("idle");

      if (useMascotStore.getState().voiceEnabled && voiceAvailable && open) {
        try {
          await audioPlayer.speak(completeText);
        } catch (error) {
          setVoiceNotice(voiceErrorMessage(error));
        }
      }
    } catch (error) {
      if (streamTimedOut) {
        replaceAssistant(
          assistantId,
          completeText.trim()
            ? `${completeText}\n\n（${STREAM_TIMEOUT_MESSAGE}）`
            : STREAM_TIMEOUT_MESSAGE,
          true,
        );
        if (isCurrentRequest()) setChatPhase("error");
        return;
      }
      if (controller.signal.aborted) {
        removeAssistantIfEmpty(assistantId);
        if (isCurrentRequest()) setChatPhase("idle");
        return;
      }
      const message =
        error instanceof MascotResponseError
          ? error.message
          : FRIENDLY_AI_ERROR;
      replaceAssistant(assistantId, message || FRIENDLY_AI_ERROR, true);
      if (isCurrentRequest()) setChatPhase("error");
    } finally {
      clearStreamTimeout();
      if (isCurrentRequest()) abortController.current = null;
      if (activeAssistantId.current === assistantId) {
        activeAssistantId.current = null;
      }
    }
  };

  const cancel = () => {
    const assistantId = activeAssistantId.current;
    abortController.current?.abort();
    abortController.current = null;
    activeAssistantId.current = null;
    if (assistantId) removeAssistantIfEmpty(assistantId);
    setChatPhase("idle");
  };

  const toggleVoice = () => {
    if (!voiceAvailable) return;
    const next = !voiceEnabled;
    setVoiceNotice(undefined);
    setVoiceEnabled(next);
    if (!next) {
      audioPlayer.stop();
    } else {
      const latestAssistantMessage = [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" &&
            message.id !== "mascot-welcome" &&
            message.content.trim() &&
            !message.error,
        );
      void (async () => {
        try {
          await audioPlayer.unlock();
          void audioPlayer.preloadInteractionVoices();
          if (!generating && latestAssistantMessage) {
            await audioPlayer.speak(latestAssistantMessage.content);
          }
        } catch (error) {
          setVoiceNotice(voiceErrorMessage(error));
        }
      })();
    }
    try {
      localStorage.setItem("mascot.voiceEnabled", String(next));
    } catch {
      // 浏览器存储不可用时，本次访问仍可继续使用语音。
    }
  };

  const phaseLabel =
    voicePhase === "speaking"
      ? "正在朗读"
      : voicePhase === "loading"
        ? "正在准备语音"
        : chatPhase === "thinking"
          ? "正在思考"
          : chatPhase === "streaming"
            ? "正在回答"
            : chatPhase === "error"
              ? "连接不太稳定"
              : `${hostContext.site?.name ?? features.mascotName} 看板娘`;

  const inputDisabled = !features.aiEnabled || !features.aiConfigured;
  const placeholder = !features.aiEnabled
    ? "聊天功能暂未开放"
    : !features.aiConfigured
      ? "AI 服务尚未配置"
      : `和${features.mascotName}说点什么……`;

  return (
    <>
      <button
        type="button"
        aria-label="关闭聊天背景"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-slate-950/20 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <section
        id="mascot-chat-dialog"
        role="dialog"
        aria-label={`与${features.mascotName}聊天`}
        aria-hidden={!open}
        inert={!open}
        data-mascot-anchored={desktopPosition ? "true" : "false"}
        style={
          desktopPosition
            ? ({
                "--mascot-chat-left": `${desktopPosition.left}px`,
                "--mascot-chat-top": `${desktopPosition.top}px`,
              } as CSSProperties)
            : undefined
        }
        className={`mascot-chat-panel fixed inset-x-0 bottom-0 z-[70] flex h-[70dvh] max-h-[70dvh] flex-col overflow-hidden rounded-t-3xl border border-emerald-950/10 bg-[#fffdf8] shadow-[0_-16px_48px_rgba(15,23,42,0.18)] transition duration-200 lg:inset-auto lg:h-[min(500px,calc(100dvh-2.5rem))] lg:max-h-[500px] lg:w-[360px] lg:rounded-3xl lg:shadow-[0_20px_60px_rgba(34,58,45,0.2)] dark:border-white/10 dark:bg-slate-900 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-6 opacity-0 lg:translate-y-2 lg:scale-95"
        }`}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-emerald-950/10 px-4 py-3 dark:border-white/10">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-lg text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            aria-hidden="true"
          >
            羽
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {features.mascotName}
            </h2>
            <p
              className="truncate text-xs text-slate-500 dark:text-slate-400"
              aria-live="polite"
            >
              {phaseLabel}
            </p>
          </div>
          <MemoryButton
            enabled={features.memoryEnabled}
            active={memoryNoticeOpen}
            onToggle={() => setMemoryNoticeOpen((current) => !current)}
          />
          <VoiceButton
            mascotName={features.mascotName}
            available={voiceAvailable}
            enabled={voiceEnabled}
            phase={voicePhase}
            onToggle={toggleVoice}
          />
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-xl text-slate-500 transition outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="关闭聊天"
            title="关闭聊天"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8f5ee] px-4 py-4 dark:bg-slate-950/60"
          aria-live="polite"
        >
          <div className="flex flex-col gap-3.5">
            {messages.map((message) => (
              <MascotMessage
                key={message.id}
                mascotName={features.mascotName}
                message={message}
                pending={message.id === messages.at(-1)?.id && generating}
                streaming={
                  message.id === messages.at(-1)?.id &&
                  chatPhase === "streaming"
                }
              />
            ))}
          </div>
          {memoryNoticeOpen ? (
            <div
              className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:border-amber-600/30 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              {features.memoryEnabled
                ? "长期记忆接口已启用；只有接入持久化 Provider 并获得你的主动允许后才会保存内容。"
                : `长期记忆功能暂未开启。未来${features.mascotName}可以在你主动允许后记住昵称、兴趣和学习主题。`}
            </div>
          ) : null}
          {voiceNotice ? (
            <div
              className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200"
              role="status"
            >
              {voiceNotice}
            </div>
          ) : null}
          {!features.aiEnabled || !features.aiConfigured ? (
            <div
              className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              role="status"
            >
              {!features.aiEnabled
                ? `聊天功能暂未开放，Live2D ${features.mascotName}仍会陪你逛博客。`
                : "AI 服务端凭据和模型尚未配置。"}
            </div>
          ) : null}
          <div ref={scrollAnchor} />
        </div>

        {messages.length <= 1 && features.aiEnabled ? (
          <MascotSuggestions
            page={hostContext.page}
            disabled={inputDisabled || generating}
            onSelect={(prompt) => void send(prompt)}
          />
        ) : null}
        <MascotInput
          mascotName={features.mascotName}
          value={input}
          maxLength={features.maxInputChars}
          disabled={inputDisabled}
          generating={generating}
          placeholder={placeholder}
          onChange={setInput}
          onSubmit={() => void send()}
          onCancel={cancel}
        />
      </section>
    </>
  );
}
