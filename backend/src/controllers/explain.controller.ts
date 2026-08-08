import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as fileExplanationService from "../services/fileExplanationService";

export const explainFileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { repositoryId, path } = req.body as {
      repositoryId: string;
      path: string;
    };
    const result = await fileExplanationService.explainFile(
      repositoryId,
      path
    );
    sendSuccess(res, result);
  }
);
