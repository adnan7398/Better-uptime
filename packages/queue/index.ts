import IORedis from "ioredis";
import { Queue } from "bullmq";

export const MONITOR_QUEUE_NAME = "monitor-checks";
export const ALERT_QUEUE_NAME = "alert-emails";

export const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null
});

export type MonitorJobData = {
    monitorId: string;
};

export type AlertJobData = {
    monitorId: string;
    previousStatus: string | null;
    newStatus: string;
    checkedAt: string;
};

export const monitorQueue = new Queue<MonitorJobData>(MONITOR_QUEUE_NAME, { connection });
export const alertQueue = new Queue<AlertJobData>(ALERT_QUEUE_NAME, { connection });

export async function upsertMonitorSchedule(monitorId: string, intervalSeconds: number) {
    await monitorQueue.upsertJobScheduler(
        monitorId,
        { every: intervalSeconds * 1000 },
        { name: "run-check", data: { monitorId } }
    );
}

export async function removeMonitorSchedule(monitorId: string) {
    await monitorQueue.removeJobScheduler(monitorId);
}

export async function getScheduledMonitorIds(): Promise<string[]> {
    const schedulers = await monitorQueue.getJobSchedulers();
    return schedulers.map((s) => s.id!).filter(Boolean);
}
