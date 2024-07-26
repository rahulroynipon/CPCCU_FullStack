import { Router } from "express";
import { upload } from "./../middlewares/upload.middleware.js";
import {
    getMember,
    getUserInfo,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAvatar,
    updateCoverImage,
    getProfile,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secure route start from here
router.route("/logout").post(verifyToken, logoutUser);
router
    .route("/update-avatar")
    .patch(verifyToken, upload.single("avatar"), updateAvatar);
router
    .route("/update-cover")
    .patch(verifyToken, upload.single("coverImage"), updateCoverImage);

router.route("/").get(verifyToken, getProfile);
// get public data start from here
router.route("/info").get(getMember);
router.route("/profile").get(getUserInfo);

export default router;
