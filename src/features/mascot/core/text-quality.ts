import type { MascotChatMessage } from "./types";

const SUSPICIOUS_ISOLATED_D =
  /(?<=[\p{Script=Han}，。！？；：、～…,.!?;:])D(?=[\p{Script=Han}，。！？；：、～…,.!?;:]|$)/gu;
// 单字叠词常用于自然语气（如“哈哈哈”“好好好”），只把 2～3 字短语连写视为异常。
const REPEATED_HAN_FRAGMENT = /([\p{Script=Han}]{2,3})\1{2,}/gu;
const LEGITIMATE_D_TERM =
  /维生素D|[23]D|D(?:盘|语言|二聚体|型|级|调|键)|(?:答案(?:是|为)?|选择|选项|按|输入|字母)D/gu;
const PROTECTED_D_TOKEN = "\uE000MASCOT_D\uE001";

function protectLegitimateDTerms(value: string) {
  return value.replace(LEGITIMATE_D_TERM, (term) =>
    term.replace("D", PROTECTED_D_TOKEN),
  );
}

function restoreLegitimateDTerms(value: string) {
  return value.replaceAll(PROTECTED_D_TOKEN, "D");
}

function suspiciousIsolatedDCount(value: string) {
  return (
    protectLegitimateDTerms(value).match(SUSPICIOUS_ISOLATED_D)?.length ?? 0
  );
}

export function hasLikelyGenerationArtifacts(value: string) {
  const isolatedDCount = suspiciousIsolatedDCount(value);

  return value.includes("\uFFFD") || isolatedDCount >= 3;
}

/**
 * 清理当前模型回复中的高置信度生成噪声。
 * 至少出现三次中文夹心孤立 D 才处理，并保护常见合法术语，降低误删风险。
 */
export function sanitizeGeneratedText(value: string) {
  const normalized = value.replaceAll("\uFFFD", "");
  const protectedText = protectLegitimateDTerms(normalized);
  const isolatedDCount =
    protectedText.match(SUSPICIOUS_ISOLATED_D)?.length ?? 0;
  if (isolatedDCount < 3) return normalized;

  // 仅在整段已高置信度判定为污染后，才一并折叠截图中“问题问题问题”式重复。
  const cleaned = protectedText
    .replace(SUSPICIOUS_ISOLATED_D, "")
    .replace(REPEATED_HAN_FRAGMENT, "$1");
  return restoreLegitimateDTerms(cleaned);
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
