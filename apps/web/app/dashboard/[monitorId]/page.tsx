import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { serverApi } from "../../../lib/api";
import { LatencyChart } from "../_components/latency-chart";
import { StatusPill } from "../_components/status-pill";
import { DeleteMonitorButton } from "../_components/delete-monitor-button";

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "1rem", minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "#6e7781" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>
        {value === null ? "—" : `${value.toFixed(2)}%`}
      </div>
    </div>
  );
}

export default async function MonitorDetailPage({
  params
}: {
  params: Promise<{ monitorId: string }>;
}) {
  const { monitorId } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  const api = serverApi(token);

  let monitor;
  try {
    monitor = await api.getMonitor(monitorId);
  } catch {
    notFound();
  }

  const [checks, uptime] = await Promise.all([
    api.getChecks(monitorId, "24h"),
    api.getUptime(monitorId, "24h,7d,30d")
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{monitor!.name || monitor!.url}</h1>
          <div style={{ color: "#6e7781", fontSize: 14 }}>{monitor!.url}</div>
          <div style={{ marginTop: 8 }}>
            <StatusPill status={monitor!.last_status} />
          </div>
        </div>
        <DeleteMonitorButton monitorId={monitor!.id} />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <StatTile label="Uptime (24h)" value={uptime["24h"] ?? null} />
        <StatTile label="Uptime (7d)" value={uptime["7d"] ?? null} />
        <StatTile label="Uptime (30d)" value={uptime["30d"] ?? null} />
      </div>

      <div>
        <h2>Response time (last 24h)</h2>
        <LatencyChart checks={checks} />
      </div>
    </div>
  );
}
