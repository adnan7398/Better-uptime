import { createClerkClient } from "@clerk/backend";
import { sendDownAlert, sendRecoveryAlert } from "mailer/client";
import type { AlertJobData } from "queue/client";
import { prismaClient } from "store/client";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function resolveOrgMemberEmails(orgId: string): Promise<string[]> {
    const { data: memberships } = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId
    });

    const emails: string[] = [];

    for (const membership of memberships) {
        const identifier = membership.publicUserData?.identifier;
        if (identifier && identifier.includes("@")) {
            emails.push(identifier);
            continue;
        }

        const userId = membership.publicUserData?.userId;
        if (!userId) continue;

        const user = await clerkClient.users.getUser(userId);
        const primaryEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress;

        if (primaryEmail) emails.push(primaryEmail);
    }

    return emails;
}

export async function processAlertJob(data: AlertJobData) {
    const monitor = await prismaClient.monitor.findUnique({ where: { id: data.monitorId } });
    if (!monitor) return;

    const emails = await resolveOrgMemberEmails(monitor.org_id);
    const monitorInfo = { id: monitor.id, url: monitor.url, name: monitor.name };

    if (data.newStatus === "Down") {
        await sendDownAlert(emails, monitorInfo, data.checkedAt);
    } else if (data.newStatus === "Up" && data.previousStatus === "Down") {
        await sendRecoveryAlert(emails, monitorInfo, data.checkedAt);
    }
}
