import { getMascotAIConfig } from "../core/config";
import { OpenAICompatibleMascotProvider } from "./openai-compatible";

export function createMascotAIProvider() {
  return new OpenAICompatibleMascotProvider(getMascotAIConfig());
}

export { OpenAICompatibleMascotProvider } from "./openai-compatible";
export type { MascotAIProvider, MascotAIStreamInput } from "./provider";
