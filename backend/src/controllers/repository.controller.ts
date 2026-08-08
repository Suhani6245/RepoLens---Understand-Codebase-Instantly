import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as architectureSummaryService from "../services/architectureSummaryService";

export const getArchitectureSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await architectureSummaryService.getArchitectureSummary(id);
    sendSuccess(res, result);
  }
);
