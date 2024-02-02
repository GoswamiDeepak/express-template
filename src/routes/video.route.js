import {
    publishAVideo,
    getVideoById,
} from "../controllers/video.controller.js";
import { upload, auth } from "../middlewares/index.js";
import express from "express";
const router = express.Router();
router.use(auth); //// Apply verifyJWT middleware to all routes in this file

router.route("/").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
);
router.route("/:id").get(getVideoById);
export default router;
