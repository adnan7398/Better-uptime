import { auth } from "@clerk/nextjs/server";
import { CreateOrganization, OrganizationList, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <div style={{ maxWidth: 480, margin: "4rem auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <h1>Create or join an organization</h1>
        <p>Monitors belong to an organization. Create one to get started, or pick an existing one.</p>
        <OrganizationList hidePersonal />
        <CreateOrganization />
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid #e5e5e5" }}>
        <Link href="/dashboard" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
          BetterUptime
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
