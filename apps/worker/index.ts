import axios from "axios";
import { Worker, type Job } from "bullmq";
import {
    connection,
    MONITOR_QUEUE_NAME,
    ALERT_QUEUE_NAME,
    alertQueue,
    type MonitorJobData,
    type AlertJobData
} from "queue/client";
import { prismaClient } from "store/client";
import { processAlertJob } from "./alerts";

const REGION_ID = process.env.REGION_ID!;

if (!REGION_ID) {
    throw new Error("Region not provided");
}

async function runCheck(job: Job<MonitorJobData>) {
    const monitor = await prismaClient.monitor.findUnique({ where: { id: job.data.monitorId } });
    if (!monitor) {
        return;
    }

    const previousStatus = monitor.last_status;
    const startTime = Date.now();
    let status: "Up" | "Down" | "Unknown" = "Unknown";

    if (monitor.type === "HTTP") {
        try {
            const response = await axios.get(monitor.url, {
                timeout: 10_000,
                validateStatus: () => true
            });
            status = response.status >= 200 && response.status < 400 ? "Up" : "Down";
        } catch {
            status = "Down";
        }
    }

    const responseTimeMs = Date.now() - startTime;
    const checkedAt = new Date();

    await prismaClient.$transaction([
        prismaClient.monitor_check.create({
            data: {
                response_time_ms: responseTimeMs,
                status,
                region_id: REGION_ID,
                monitor_id: monitor.id,
                createdAt: checkedAt
            }
        }),
        prismaClient.monitor.update({
            where: { id: monitor.id },
            data: { last_status: status, last_status_at: checkedAt }
        })
    ]);

    const isNewFailure = status === "Down" && previousStatus !== "Down";
    const isRecovery = status === "Up" && previousStatus === "Down";

    if (isNewFailure || isRecovery) {
        await alertQueue.add(
            "send-alert",
            {
                monitorId: monitor.id,
                previousStatus,
                newStatus: status,
                checkedAt: checkedAt.toISOString()
            } satisfies AlertJobData,
            { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
        );
    }
}

new Worker<MonitorJobData>(MONITOR_QUEUE_NAME, runCheck, { connection, concurrency: 10 });

new Worker<AlertJobData>(
    ALERT_QUEUE_NAME,
    async (job) => {
        await processAlertJob(job.data);
    },
    { connection }
);

console.log(`worker started for region ${REGION_ID}`);
