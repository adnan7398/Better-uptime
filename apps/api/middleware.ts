import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export function requireOrgMiddleware(req: Request, res: Response, next: NextFunction) {
    const auth = getAuth(req);

    if (!auth.isAuthenticated) {
        res.status(401).json({ error: "UNAUTHENTICATED" });
        return;
    }

    if (!auth.orgId) {
        res.status(403).json({ error: "NO_ORGANIZATION" });
        return;
    }

    req.userId = auth.userId;
    req.orgId = auth.orgId;
    next();
}
