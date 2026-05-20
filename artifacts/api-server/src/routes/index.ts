import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import usersRouter from "./users";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(usersRouter);
router.use(analyticsRouter);

export default router;
