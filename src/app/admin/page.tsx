import { AdminOverviewPage } from "@/modules/admin/admin-overview-page";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/services/admin-service";

export default async function AdminPage() {
  await requireAdmin();

  const overview = await getAdminOverview();

  return <AdminOverviewPage overview={overview} />;
}
