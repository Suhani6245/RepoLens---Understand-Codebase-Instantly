import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as dependencyGraphService from "../services/dependencyGraphService";
import { AppError } from "../utils/AppError";

export const getDependencyGraphHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await dependencyGraphService.getDependencyGraph(id);
    sendSuccess(res, result);
  }
);

export const getImpactAnalysisHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const path = req.query.path;

    if (typeof path !== "string" || path.trim().length === 0) {
      throw new AppError(
        "Query parameter 'path' is required.",
        "VALIDATION_ERROR",
        400
      );
    }

    const result = await dependencyGraphService.getImpactAnalysis(id, path);
    sendSuccess(res, result);
  }
);
