import { ok } from "@/lib/api-response";
import { listCategories } from "@/services/content-service";

export async function GET() {
  try {
    const categories = await listCategories();
    return ok(categories);
  } catch (error) {
    console.error("Categories error:", error);
    return ok([]);
  }
}
