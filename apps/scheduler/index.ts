import { prismaClient } from "store/client";
import { upsertMonitorSchedule, removeMonitorSchedule, getScheduledMonitorIds } from "queue/client";

async function reconcile() {
    const monitors = await prismaClient.monitor.findMany({
        select: { id: true, interval_seconds: true }
    });

    for (const monitor of monitors) {
        await upsertMonitorSchedule(monitor.id, monitor.interval_seconds);
    }

    const monitorIds = new Set(monitors.map((m) => m.id));
    const scheduledIds = await getScheduledMonitorIds();

    for (const scheduledId of scheduledIds) {
        if (!monitorIds.has(scheduledId)) {
            await removeMonitorSchedule(scheduledId);
        }
    }

    console.log(`reconciled ${monitors.length} monitor schedule(s)`);
}

setInterval(() => {
    reconcile();
}, 3 * 1000 * 60);

reconcile();
