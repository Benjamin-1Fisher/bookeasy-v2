import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAdminSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getAdminSummary();

  return <DashboardShell initialData={summary} />;
}
