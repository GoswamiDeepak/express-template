import express from "express";
import { upload, auth } from "../middlewares/index.js";
import {
    registerUser,
    loginUser,
    logoutuser,
    refreshAccessToken,
    chageCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/refresh-token").get(refreshAccessToken);
//secure Routes
router.route("/logout").post(auth, logoutuser);
router.route("/change-password").post(auth, chageCurrentPassword);
router
    .route("/update-avatar")
    .patch(auth, upload.single("avatar"), updateUserAvatar);  

export default router;
