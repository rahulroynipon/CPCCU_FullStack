import { Router } from "express";
import { upload } from "./../middlewares/upload.middleware.js";
import {
    getAllMember,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAvatar,
    updateCoverImage,
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
router.route("/refresh-token").post(refreshAccessToken);

// secure route start from here
router.route("/logout").post(verifyToken, logoutUser);
router
    .route("/update-avatar")
    .patch(verifyToken, upload.single("avatar"), updateAvatar);
router
    .route("/update-cover")
    .patch(verifyToken, upload.single("coverImage"), updateCoverImage);

// get public data start from here
router.route("/all-member").get(getAllMember);
export default router;
