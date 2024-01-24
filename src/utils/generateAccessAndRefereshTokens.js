import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

const generateAccessAndRefereshTokens = async (id) => {
    console.log(id);
    try {
        const user = await User.findOne(id);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        console.log(accessToken);
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new ApiError(500, error.message || "Server Down!");
    }
};
export { generateAccessAndRefereshTokens };
