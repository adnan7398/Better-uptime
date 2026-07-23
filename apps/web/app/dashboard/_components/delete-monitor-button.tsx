"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { clientApi } from "../../../lib/api";

export function DeleteMonitorButton({ monitorId }: { monitorId: string }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this monitor? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = await getToken();
      await clientApi(token).deleteMonitor(monitorId);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.5rem 1rem", color: "#cf222e" }}>
      {deleting ? "Deleting..." : "Delete monitor"}
    </button>
  );
}
