import { requireAdmin } from "@/lib/auth/session";
import { AdminPostsPage } from "@/modules/admin/admin-posts-page";

export default async function AdminPostsRoute() {
  await requireAdmin();

  return <AdminPostsPage />;
}
