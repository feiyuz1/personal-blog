import { ok } from "@/lib/api-response";
import { listArchiveGroups } from "@/services/content-service";

export async function GET() {
  try {
    const groups = await listArchiveGroups();
    return ok(groups);
  } catch (error) {
    console.error("Archive error:", error);
    return ok([]);
  }
}
