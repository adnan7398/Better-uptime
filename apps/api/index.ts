import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { requireOrgMiddleware } from "./middleware";
import { monitorsRouter } from "./routes/monitors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? [],
    credentials: true
}));
app.use(express.json());
app.use(clerkMiddleware());

app.use("/monitors", requireOrgMiddleware, monitorsRouter);

app.listen(process.env.PORT || 3001);
