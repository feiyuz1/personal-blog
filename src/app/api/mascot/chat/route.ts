import { handleMascotChatRequest } from "@/features/mascot/server/chat-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleMascotChatRequest(request);
}
