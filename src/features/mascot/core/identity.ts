export const DEFAULT_MASCOT_NAME = "小羽";

export function getMascotName() {
  return process.env.MASCOT_PERSONA_NAME?.trim() || DEFAULT_MASCOT_NAME;
}
