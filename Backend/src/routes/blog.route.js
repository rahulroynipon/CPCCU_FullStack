import { Router } from "express";
import { verifyToken } from "../middlewares/Auth.middleware.js";
import { verifyBlogOwner } from "../middlewares/blogAuth.middleware.js";

import {
    createBlog,
    deleteBlog,
    getBlog,
    updateBlog,
} from "../controllers/blog.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// secure blog
router
    .route("/create")
    .post(verifyToken, upload.single("thumbnail"), createBlog);
router.route("/update").patch(verifyToken, verifyBlogOwner, updateBlog);
router.route("/delete").delete(verifyToken, verifyBlogOwner, deleteBlog);

// get
router.route("/").get(getBlog);

export default router;
