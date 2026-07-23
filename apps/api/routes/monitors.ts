import { Router } from "express";
import { prismaClient } from "store/client";
import { upsertMonitorSchedule, removeMonitorSchedule } from "queue/client";
import { CreateMonitorInput, UpdateMonitorInput } from "../types";

export const monitorsRouter = Router();

const WINDOW_MS: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000
};

monitorsRouter.post("/", async (req, res) => {
    const data = CreateMonitorInput.safeParse(req.body);
    if (!data.success) {
        res.status(411).json({ error: data.error.flatten() });
        return;
    }

    const monitor = await prismaClient.monitor.create({
        data: {
            url: data.data.url,
            name: data.data.name,
            type: data.data.type,
            interval_seconds: data.data.interval_seconds,
            org_id: req.orgId!,
            created_by: req.userId!
        }
    });

    await upsertMonitorSchedule(monitor.id, monitor.interval_seconds);

    res.json(monitor);
});

monitorsRouter.get("/", async (req, res) => {
    const monitors = await prismaClient.monitor.findMany({
        where: { org_id: req.orgId! },
        orderBy: { created_at: "desc" },
        include: {
            checks: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    res.json(monitors);
});

monitorsRouter.get("/:id", async (req, res) => {
    const monitor = await prismaClient.monitor.findFirst({
        where: { id: req.params.id, org_id: req.orgId! }
    });

    if (!monitor) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
    }

    res.json(monitor);
});

monitorsRouter.patch("/:id", async (req, res) => {
    const data = UpdateMonitorInput.safeParse(req.body);
    if (!data.success) {
        res.status(411).json({ error: data.error.flatten() });
        return;
    }

    const existing = await prismaClient.monitor.findFirst({
        where: { id: req.params.id, org_id: req.orgId! }
    });

    if (!existing) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
    }

    const monitor = await prismaClient.monitor.update({
        where: { id: existing.id },
        data: data.data
    });

    if (
        data.data.interval_seconds !== undefined &&
        data.data.interval_seconds !== existing.interval_seconds
    ) {
        await upsertMonitorSchedule(monitor.id, monitor.interval_seconds);
    }

    res.json(monitor);
});

monitorsRouter.delete("/:id", async (req, res) => {
    const existing = await prismaClient.monitor.findFirst({
        where: { id: req.params.id, org_id: req.orgId! }
    });

    if (!existing) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
    }

    await prismaClient.monitor.delete({ where: { id: existing.id } });
    await removeMonitorSchedule(existing.id);

    res.json({ id: existing.id });
});

monitorsRouter.get("/:id/checks", async (req, res) => {
    const monitor = await prismaClient.monitor.findFirst({
        where: { id: req.params.id, org_id: req.orgId! }
    });

    if (!monitor) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
    }

    const window = typeof req.query.window === "string" ? req.query.window : "24h";
    const windowMs = WINDOW_MS[window] ?? WINDOW_MS["24h"];

    const checks = await prismaClient.monitor_check.findMany({
        where: {
            monitor_id: monitor.id,
            createdAt: { gte: new Date(Date.now() - windowMs) }
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, response_time_ms: true, status: true }
    });

    res.json(checks);
});

monitorsRouter.get("/:id/uptime", async (req, res) => {
    const monitor = await prismaClient.monitor.findFirst({
        where: { id: req.params.id, org_id: req.orgId! }
    });

    if (!monitor) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
    }

    const requested = typeof req.query.windows === "string" ? req.query.windows.split(",") : ["24h", "7d", "30d"];
    const windows = requested.filter((w) => w in WINDOW_MS);

    const result: Record<string, number | null> = {};

    for (const window of windows) {
        const groups = await prismaClient.monitor_check.groupBy({
            by: ["status"],
            where: {
                monitor_id: monitor.id,
                createdAt: { gte: new Date(Date.now() - WINDOW_MS[window]) }
            },
            _count: true
        });

        const total = groups.reduce((sum, g) => sum + g._count, 0);
        const down = groups.find((g) => g.status === "Down")?._count ?? 0;

        result[window] = total === 0 ? null : ((total - down) / total) * 100;
    }

    res.json(result);
});
