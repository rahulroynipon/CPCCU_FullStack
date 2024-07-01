import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyToken = asyncHandler(async (req, res, next) => {
    try {
        const Token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer", " ");

        if (!Token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodededToken = jwt.verify(
            Token,
            process.env.ACCESS_TOKEN_SCRECT
        );

        const existedUser = await User.findById(decodededToken?._id);

        if (!existedUser) {
            throw new ApiError(401, "invalid Access Token");
        }

        res.user = existedUser;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export { verifyToken };
