import { Router } from "express";

import {
    verifyAdmin,
    verifyModerator,
    verifyToken,
} from "../middlewares/Auth.middleware.js";
import {
    changeRole,
    deleteBlogByModerator,
    deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/admin/update/roles").patch(verifyToken, verifyAdmin, changeRole);
router.route("/admin/delete/user").delete(verifyToken, verifyAdmin, deleteUser);
router
    .route("/admin/delete/blog")
    .delete(verifyToken, verifyModerator, deleteBlogByModerator);

export default router;
