import { handleMascotTTSRequest } from "@/features/mascot/server/tts-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleMascotTTSRequest(request);
}
