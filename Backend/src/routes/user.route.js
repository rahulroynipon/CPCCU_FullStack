import { Router } from "express";
import { upload } from "./../middlewares/upload.middleware.js";
import {
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secure route start from here
router.route("/logout").post(verifyToken, logoutUser);

export default router;
