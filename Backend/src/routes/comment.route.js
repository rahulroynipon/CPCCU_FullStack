import { Router } from "express";
import { verifyToken } from "../middlewares/Auth.middleware.js";
import {
    createComment,
    deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();

//comment route
router.route("/create").post(verifyToken, createComment);
router.route("/delete").delete(verifyToken, deleteComment);

export default router;
