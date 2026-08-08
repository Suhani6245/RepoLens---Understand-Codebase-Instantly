import { Router } from "express";
import { askQuestionHandler } from "../controllers/question.controller";
import { requireFields } from "../middlewares/validateBody";

export const questionRouter = Router();

questionRouter.post(
  "/",
  requireFields(["repositoryId", "question"]),
  askQuestionHandler
);
