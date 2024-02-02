import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const auth = async (req, res, next) => {
    try {
        const accessToken =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken -__v"
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
