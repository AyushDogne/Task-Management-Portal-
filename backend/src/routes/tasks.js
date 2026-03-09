import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createTask,
  getTasks,
  toggleTaskStatus,
} from "../controllers/taskController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/", getTasks);
router.patch("/:id/toggle", toggleTaskStatus);

export default router;

