export function voiceErrorMessage(error: unknown) {
  const notice =
    error instanceof Error ? error.message : "语音暂时不可用，请稍后再试。";
  return notice.includes("文字回答不受影响")
    ? notice
    : `${notice} 文字回答不受影响。`;
}
