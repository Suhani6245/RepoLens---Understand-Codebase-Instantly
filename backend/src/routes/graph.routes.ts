import { Router } from "express";
import {
  getDependencyGraphHandler,
  getImpactAnalysisHandler,
} from "../controllers/graph.controller";

export const graphRouter = Router();

graphRouter.get("/:id/impact", getImpactAnalysisHandler);
graphRouter.get("/:id", getDependencyGraphHandler);
