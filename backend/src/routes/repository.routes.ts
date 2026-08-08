import { Router } from "express";
import { getArchitectureSummaryHandler } from "../controllers/repository.controller";

export const repositoryRouter = Router();

repositoryRouter.get("/:id/architecture", getArchitectureSummaryHandler);
