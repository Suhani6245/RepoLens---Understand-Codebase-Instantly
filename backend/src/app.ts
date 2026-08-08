import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { apiRouter } from "./routes";
import { sendSuccess } from "./utils/apiResponse";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigin,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", uptime: process.uptime() });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
