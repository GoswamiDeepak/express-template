import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

const generateAccessAndRefereshTokens = async (id) => {
    try {
        const user = await User.findById(id);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new ApiError(500, error.message || "Server Down!");
    }
};
export { generateAccessAndRefereshTokens };
