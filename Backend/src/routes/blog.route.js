import { Router } from "express";
import { verifyToken } from "../middlewares/Auth.middleware.js";
import { createBlog, getBlog } from "../controllers/blog.controller.js";

const router = Router();

// secure blog
router.route("/create").post(verifyToken, createBlog);

// get
router.route("/").get(getBlog);

export default router;
