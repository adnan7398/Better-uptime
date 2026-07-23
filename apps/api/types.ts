import { z } from "zod";

export const CreateMonitorInput = z.object({
    url: z.string().url(),
    name: z.string().min(1).optional(),
    type: z.enum(["HTTP", "TCP"]).default("HTTP"),
    interval_seconds: z.number().int().min(30).default(180)
});

export const UpdateMonitorInput = CreateMonitorInput.partial();
