const COLORS: Record<string, string> = {
  Up: "#1a7f37",
  Down: "#cf222e",
  Unknown: "#6e7781"
};

export function StatusPill({ status }: { status: string | null }) {
  const label = status ?? "Pending";
  const color = COLORS[status ?? ""] ?? "#6e7781";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        fontSize: "0.85rem",
        color
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}
