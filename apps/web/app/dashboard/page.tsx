import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { serverApi } from "../../lib/api";
import { CreateMonitorForm } from "./_components/create-monitor-form";
import { StatusPill } from "./_components/status-pill";

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const monitors = await serverApi(token).listMonitors();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section>
        <h2>Add a monitor</h2>
        <CreateMonitorForm />
      </section>

      <section>
        <h2>Monitors</h2>
        {monitors.length === 0 ? (
          <p>No monitors yet — add one above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e5e5" }}>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Name</th>
                <th style={{ padding: "0.5rem" }}>URL</th>
                <th style={{ padding: "0.5rem" }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => {
                const latestCheck = monitor.checks?.[0];
                return (
                  <tr key={monitor.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <StatusPill status={monitor.last_status} />
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <Link href={`/dashboard/${monitor.id}`}>{monitor.name || monitor.url}</Link>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{monitor.url}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {latestCheck ? `${latestCheck.response_time_ms}ms` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
