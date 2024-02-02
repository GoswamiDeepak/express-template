import {
    AsyncHandler,
    ApiError,
    ApiResponce,
    uploadOnCloudinary,
    generateAccessAndRefereshTokens,
    deleteFromCloudinary,
} from "../utils/index.js";
import { User } from "../models/user.model.js";
import { Cookie_Options } from "../constants.js";
import jwt from "jsonwebtoken";

const registerUser = AsyncHandler(async (req, res) => {
    const { fullname, username, email, phone, password } = req.body;
    if (
        [fullname, username, email, phone, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields are required!");
    }
    try {
        //Cheak karna hai user exist karta hai ya nhi
        const existUser = await User.findOne({
            $or: [{ username }, { email }, { phone }],
        });
        if (existUser) {
            throw new ApiError(409, "User Already exist!");
        }
        // console.log(req.files);
        const avatarPath = req?.files?.avatar[0].path;
        const coverImagePath = req?.files?.coverImage[0].path;

        const avatar = await uploadOnCloudinary(avatarPath);
        const coverImage = await uploadOnCloudinary(coverImagePath);

        if (!avatar) {
            throw new ApiError(400, "Cloudinary can't handle avatar file!");
        }
        if (!coverImage) {
            throw new ApiError(400, "Cloudinary can't handle coverImage file!");
        }

        const createdUser = await User.create({
            fullname,
            username: username?.toLowerCase(),
            email,
            password,
            phone,
            avatar: avatar?.url,
            coverImage: coverImage?.url || "",
        });
        const user = await User.findById(createdUser._id).select(
            "-password -refreshToken -__v"
        );
        if (!user) {
            throw new ApiError(500, "Something Went Wrong!");
        }
        return res
            .status(200)
            .json(new ApiResponce(200, user, "User registered successfully!"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error.message || "Server Down");
    }
});

const loginUser = AsyncHandler(async (req, res) => {
    const { context, password } = req.body;
    const existUser = await User.findOne({
        $or: [{ username: context }, { email: context }, { phone: context }],
    });
    if (!existUser) {
        throw new ApiError(409, "User does not exist!");
    }
    const passwordCheck = await existUser.isPasswordCorrect(password);
    if (!passwordCheck) {
        throw new ApiError(401, "Password Incorrect!");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        existUser._id
    );

    const payload = {
        _id: existUser._id,
        phone: existUser.phone,
        fullname: existUser.fullname,
        username: existUser.username,
        avatar: existUser.avatar,
        coverImage: existUser.coverImage,
        watchHistory: existUser.watchHistory,
    };

    res.status(200)
        .cookie("accessToken", accessToken, Cookie_Options)
        .cookie("refreshToken", refreshToken, Cookie_Options)
        .json(
            new ApiResponce(
                200,
                {
                    user: payload,
                    accessToken,
                    refreshToken,
                },
                "Login successFull !"
            )
        );
});

const logoutuser = AsyncHandler(async (req, res) => {
    //[+]update the document from collection by remove refreshtoken field
    //[+]remove cookie from header
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                // refreshToken: "",
                $unset: {
                    refreshToken: 1,
                },
            },
            {
                new: true,
            }
        );

        res.status(200)
            .clearCookie("accessToken", Cookie_Options)
            .clearCookie("refreshToken", Cookie_Options)
            .clearCookie("RefreshToken", Cookie_Options)
            .json(new ApiResponce("200", {}, "Logout SccessFull !"));
    } catch (error) {
        throw new ApiError(500, error.message || "Server Down ");
    }
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
    //[+] get refreshToken by req.cookies.refreshToken or req.body.refreshtoken
    //[+] jwt verify refreshtoken
    //[+] match verify refreshtoken from db and user's given refresh token
    //[+] generate new accessToken and refeshToken
    //[+] send new accessToken and refreshToken to user as refresh

    const incomingRefreshToken =
        req.cookies.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "No Refresh Token found !");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken -__v"
        );
        if (!user) {
            throw new ApiError(400, "no user find");
        }
        const { accessToken, refreshToken } =
            await generateAccessAndRefereshTokens(decodedToken._id);
        res.status(200)
            .cookie("accessToken", accessToken, Cookie_Options)
            .cookie("refreshToken", refreshToken, Cookie_Options)
            .json(
                new ApiResponce(
                    200,
                    { user, accessToken, refreshToken },
                    "New Access Token & refresh Token generated!"
                )
            );
    } catch (error) {
        console.log(error);
        throw new ApiError(401, error || "Invalid Refresh Token!");
    }
});

const chageCurrentPassword = AsyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new ApiError(
                400,
                "Enter your old password and new password!"
            );
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError(400, "User Not found!");
        }
        const isPasswordValid = await user.isPasswordCorrect(
            String(oldPassword)
        );
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid old password!");
        }
        user.password = newPassword.toString();
        await user.save({
            validateBeforeSave: false,
        });
        return res
            .status(200)
            .json(new ApiResponce(200, {}, "Password updated successfully!"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error || "Server down!");
    }
});

const getCurrentUser = AsyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponce(200, req.user, "User's data!"));
});

const updateAccountDetails = AsyncHandler(async (req, res) => {
    try {
        const { username, fullname, phone, email } = req.body;
        if (!username || !fullname || !phone || !email) {
            throw new ApiError(400, "All Fields are required!");
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    username,
                    fullname,
                    email,
                    phone,
                },
            },
            {
                new: true,
            }
        ).select("-password -refreshToken -__v");
        if (!user) {
            throw new ApiError(400, "User not found !");
        }
        res.status(200).json(new ApiResponce(200, user, "user field updated!"));
    } catch (error) {
        console.log(error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Server down!"
        );
    }
});

const updateUserAvatar = AsyncHandler(async (req, res) => {
    //[-]take file path
    //[-]remove the old image
    //[-]upload the new image
    try {
        console.log(req.file);
        const avatar = req.file?.path;

        if (!avatar) {
            throw new ApiError(400, "Plese give avatar image!");
        }
        await deleteFromCloudinary(req.user.avatar);
        const newAvatar = await uploadOnCloudinary(avatar);
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: newAvatar.url,
                },
            },
            {
                new: true,
            }
        ).select("-password -refreshToken -__v");
        res.status(200).json(
            new ApiResponce(200, user, "Avatar Image updated!")
        );
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error || "Surver Down!");
    }
});

const updateUserCoverImage = AsyncHandler(async (req, res) => {
    try {
        const coverImage = req.file?.path;
        if (!coverImage) {
            throw new ApiError(400, "Plese give Coverimage!");
        }
        const deletedCoverImage = await deleteFromCloudinary(
            req.user.coverImage
        );
        if (!deletedCoverImage) {
            throw new ApiError(
                400,
                "Cloudinary can't remove the image from server"
            );
        }
        const newCoverImage = await uploadOnCloudinary(coverImage);
        if (!newCoverImage) {
            throw new ApiError(400, "Cloudinary can't upload the image");
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: newCoverImage.url,
                },
            },
            {
                new: true,
            }
        ).select("-password -refreshToken -__v");
        if (!user) {
            throw new ApiError(401, "User do not found");
        }
        res.status(200).json(
            new ApiResponce(200, user, "Cover Image updated!")
        );
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error || "Surver Down!");
    }
});

const getUserChannelProfile = AsyncHandler(async (req, res) => {});

const getWatchHistory = AsyncHandler(async (req, res) => {});

export {
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
};
