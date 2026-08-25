import { getMascotTTSConfig } from "../core/config";
import { OpenAICompatibleTTSProvider } from "./openai-compatible";

export function createMascotTTSProvider() {
  return new OpenAICompatibleTTSProvider(getMascotTTSConfig());
}

export { OpenAICompatibleTTSProvider } from "./openai-compatible";
export type {
  MascotAudioResult,
  MascotTTSInput,
  MascotTTSProvider,
} from "./provider";
