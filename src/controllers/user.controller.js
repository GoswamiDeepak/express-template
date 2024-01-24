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
                refreshToken: "",
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
    // console.log(req.cookies);
    // return;
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "No Refresh Token found !");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id);
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
        throw new ApiError(401, error || "Invalid Refresh Token!");
    }
});

const chageCurrentPassword = AsyncHandler(async (req, res) => {
    //[-][+] Get old Password, new password
    //[-][+] match old password is valid
    //[-][+] if old password is valid then replace password with new password

    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        const isPasswordValid = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid old password!");
        }
        //Step 1 to replace password
        /*
        await User.findByIdAndUpdate(
            user._id,
            {
                $set: {
                    password: newPassword,
                },
            },
            {
                new: true,
            }
        );
        */

        //step 2 tp replace password
        user.password = newPassword;
        await user.save({
            validateBeforeSave: false,
        });

        return res
            .status(200)
            .json(new ApiResponce(200, {}, "Password updated successfully!"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error || "Server down!");
    }
});

const getCurrentUser = AsyncHandler(async (req, res) => {
    //[-]get user data from the req
    res.status(200).json(new ApiResponce(200, req.user, "User's data!"));
});

const updateAccountDetails = AsyncHandler(async (req, res) => {
    //[-][+] user ke field jaise username, email, phone, full name ko lena
    //[-][+] error responce karna hai agar koi bhi field miss rahti hai upper me se- send error reponce wheather any upper feild are empty
    //[-][+] update the newly data from old one document and leave unnecessary feild

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
        ).select("-password - refreshToken");
        res.status(200).json(new ApiResponce(200, user, "user field updated!"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error.message || "Server down!");
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
    //[-]take file path
    //[-]remove the old image
    //[-]upload the new image
    try {
        const coverImage = req.file?.avatar?.path;
        if (!coverImage) {
            throw new ApiError(400, "Plese give avatar image!");
        }
        await deleteFromCloudinary(req.user.coverImage);
        const newCoverImage = await uploadOnCloudinary(coverImage);
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
        res.status(200).json(new ApiError(200, user, "Cover Image updated!"));
    } catch (error) {
        throw new ApiError(500, error || "Surver Down!");
    }
});

const getUserChannelProfile = AsyncHandler(async (req, res) => {
    
});

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
