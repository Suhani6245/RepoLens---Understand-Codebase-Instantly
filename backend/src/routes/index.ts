import { Router } from "express";
import { analyzeRouter } from "./analyze.routes";
import { explainRouter } from "./explain.routes";
import { questionRouter } from "./question.routes";
import { repositoryRouter } from "./repository.routes";
import { graphRouter } from "./graph.routes";

export const apiRouter = Router();

apiRouter.use("/analyze", analyzeRouter);
apiRouter.use("/explain", explainRouter);
apiRouter.use("/question", questionRouter);
apiRouter.use("/repository", repositoryRouter);
apiRouter.use("/graph", graphRouter);
