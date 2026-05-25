import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAdminSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ businessId?: string }> }) {
  const params = await searchParams;
  const summary = await getAdminSummary(params?.businessId);

  return <DashboardShell initialData={summary} />;
}
