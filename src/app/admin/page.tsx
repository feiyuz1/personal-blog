import { AdminOverviewPage } from "@/modules/admin/admin-overview-page";
import { getAdminOverview } from "@/services/admin-service";

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return <AdminOverviewPage overview={overview} />;
}
