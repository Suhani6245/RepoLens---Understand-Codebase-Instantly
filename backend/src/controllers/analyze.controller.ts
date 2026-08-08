import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as repositoryAnalysisService from "../services/repositoryAnalysisService";

export const analyzeRepositoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { repoUrl } = req.body as { repoUrl: string };
    const result = await repositoryAnalysisService.analyzeRepository(repoUrl);
    sendSuccess(res, result, 201);
  }
);
