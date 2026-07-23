import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationSettingsPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <OrganizationProfile />
    </div>
  );
}
