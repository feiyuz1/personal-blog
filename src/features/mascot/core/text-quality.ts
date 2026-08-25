import type { MascotChatMessage } from "./types";

const SUSPICIOUS_ISOLATED_D =
  /(?<=[\p{Script=Han}，。！？；：、～…])D(?=[\p{Script=Han}，。！？；：、～…])/gu;
const REPEATED_HAN_FRAGMENT = /([\p{Script=Han}]{1,3})\1{2,}/u;

export function hasLikelyGenerationArtifacts(value: string) {
  const isolatedDCount = value.match(SUSPICIOUS_ISOLATED_D)?.length ?? 0;

  return (
    value.includes("\uFFFD") ||
    isolatedDCount >= 2 ||
    REPEATED_HAN_FRAGMENT.test(value)
  );
}

export function discardContaminatedHistory(history: MascotChatMessage[]) {
  let lastContaminatedAssistant = -1;

  for (let index = 0; index < history.length; index += 1) {
    const message = history[index];
    if (
      message?.role === "assistant" &&
      hasLikelyGenerationArtifacts(message.content)
    ) {
      lastContaminatedAssistant = index;
    }
  }

  return history.slice(lastContaminatedAssistant + 1);
}
