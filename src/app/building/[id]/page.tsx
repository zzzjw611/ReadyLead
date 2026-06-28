import { AppShell } from "@/components/Shell";
import { BuildingDetail } from "@/components/building/BuildingDetail";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <BuildingDetail buildingId={id} />
    </AppShell>
  );
}
