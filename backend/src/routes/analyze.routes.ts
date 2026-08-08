import { Router } from "express";
import { analyzeRepositoryHandler } from "../controllers/analyze.controller";
import { requireFields } from "../middlewares/validateBody";

export const analyzeRouter = Router();

analyzeRouter.post("/", requireFields(["repoUrl"]), analyzeRepositoryHandler);
