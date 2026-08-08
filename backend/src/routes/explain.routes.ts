import { Router } from "express";
import { explainFileHandler } from "../controllers/explain.controller";
import { requireFields } from "../middlewares/validateBody";

export const explainRouter = Router();

explainRouter.post(
  "/",
  requireFields(["repositoryId", "path"]),
  explainFileHandler
);
