import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const auth = async (req, res, next) => {
    try {
        const accessToken =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        // if (!accessToken) {
        //     throw new ApiError(401, "Unauthoried Request !");
        // }
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            sucess: false,
            message: "Unauthorized User",
            error: error,
        });
    }
};

export { auth };
