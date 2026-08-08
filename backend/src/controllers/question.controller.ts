import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as questionAnsweringService from "../services/questionAnsweringService";

export const askQuestionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { repositoryId, question } = req.body as {
      repositoryId: string;
      question: string;
    };
    const result = await questionAnsweringService.askQuestion(
      repositoryId,
      question
    );
    sendSuccess(res, result);
  }
);
