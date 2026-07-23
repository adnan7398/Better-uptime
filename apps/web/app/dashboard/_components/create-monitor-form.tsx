"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { clientApi } from "../../../lib/api";

export function CreateMonitorForm() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(180);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      await clientApi(token).createMonitor({
        url,
        name: name || undefined,
        interval_seconds: intervalSeconds
      });
      setUrl("");
      setName("");
      router.refresh();
    } catch (err) {
      setError("Could not create monitor — check the URL and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
      <input
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        style={{ padding: "0.5rem", minWidth: 240 }}
      />
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: "0.5rem" }}
      />
      <select
        value={intervalSeconds}
        onChange={(e) => setIntervalSeconds(Number(e.target.value))}
        style={{ padding: "0.5rem" }}
      >
        <option value={30}>Every 30s</option>
        <option value={60}>Every 1 min</option>
        <option value={180}>Every 3 min</option>
        <option value={300}>Every 5 min</option>
      </select>
      <button type="submit" disabled={submitting} style={{ padding: "0.5rem 1rem" }}>
        {submitting ? "Adding..." : "Add monitor"}
      </button>
      {error && <span style={{ color: "#cf222e" }}>{error}</span>}
    </form>
  );
}
