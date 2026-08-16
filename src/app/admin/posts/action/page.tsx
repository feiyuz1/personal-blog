import { requireAdmin } from "@/lib/auth/session";
import { AdminPostActionPage } from "@/modules/admin/admin-post-action-page";

export default async function AdminPostActionRoute() {
  await requireAdmin();

  return <AdminPostActionPage />;
}
