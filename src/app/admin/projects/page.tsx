import { requireAdmin } from "@/lib/auth/session";
import { AdminProjectsPage } from "@/modules/admin/admin-projects-page";
import { listAllProjects } from "@/services/admin-service";

export default async function AdminProjectsRoute() {
  await requireAdmin();
  const result = await listAllProjects({ page: 1, pageSize: 100 });

  return (
    <AdminProjectsPage
      initialProjects={result.list}
      initialTotal={result.total}
    />
  );
}
