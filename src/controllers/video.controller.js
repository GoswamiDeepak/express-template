import {
    AsyncHandler,
    ApiError,
    ApiResponce,
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/index.js";
import { Video } from "../models/video.model.js";

const publishAVideo = AsyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            throw new ApiError(
                400,
                "Title and Description are required fields!"
            );
        }
        const videoFilePath = req.files?.videoFile[0].path;
        const thumbnailPath = req.files?.thumbnail[0].path;
        if (!videoFilePath) {
            throw new ApiError(400, "Please give the videoFile");
        }
        if (!thumbnailPath) {
            throw new ApiError(400, "Please give the thumbnail");
        }
        const videoFile = await uploadOnCloudinary(videoFilePath);
        const thumbnail = await uploadOnCloudinary(thumbnailPath);
        if (!videoFile) {
            throw new ApiError(
                400,
                "Video File is not uploaded on server.Try Again later"
            );
        }
        if (!thumbnail) {
            throw new ApiError(
                400,
                "Thumbnail is not uploaded on server.Try Again later"
            );
        }
        const video = await Video.create({
            videoFile: videoFile?.url,
            thumbnail: thumbnail?.url,
            owner: req.user._id,
            title,
            description,
            duration: videoFile?.duration,
        });
        if (!video) {
            throw new ApiError(400, "Video can't downloaded!");
        }
        res.status(201).json(
            new ApiResponce(200, video, "video uploaded succesfully!")
        );
    } catch (error) {
        console.log(error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Server down!"
        );
    }
});

const getVideoById = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Give video id!");
    }
    const video = await Video.findById(id)
        .populate("owner","fullname username")
        .select("-__v");
    if (!video) {
        throw new ApiError(400, "Wrong Video id. Kindly give correct the id.");
    }
    res.status(200).json(new ApiResponce(200, video, "Video details"));
});

export { publishAVideo, getVideoById };
