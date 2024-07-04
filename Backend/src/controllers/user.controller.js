import asyncHandler from "./../utils/asyncHandler.js";
import { ApiError } from "./../utils/ApiError.js";
import { ApiResponse } from "./../utils/ApiResponse.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudinary } from "./../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generation refresh or access token"
        );
    }
};

const userDataCollection = async (username, userId) => {
    let query = {};

    if (username && typeof username === "string") {
        query.username = username.toLowerCase();
    }

    if (
        userId &&
        (typeof userId === "string" || mongoose.Types.ObjectId.isValid(userId))
    ) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
            query._id = new mongoose.Types.ObjectId(userId);
        } else {
            query._id = userId;
        }
    }

    const profile = await User.aggregate([
        {
            $match: query,
        },
        {
            $lookup: {
                from: "blogs",
                localField: "_id",
                foreignField: "owner",
                as: "personalBlogs",
            },
        },
        {
            $project: {
                username: 1,
                email: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                uni_id: 1,
                batch: 1,
                personalBlogs: 1,
            },
        },
    ]);

    return profile;
};

const options = {
    httpOnly: true,
    secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password, batch, uni_id } = req.body;

    if (
        [username, email, fullname, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: "",
        coverImage: "",
        batch,
        uni_id,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User is not existed");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Wrong password");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user?._id
    );

    const loggedInUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SCRECT
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = await user.generateAccessToken(user._id);
        const refreshToken = user.refreshToken;

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// update controller start from here
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is missing");
    }

    const avatarImage = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarImage.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatarImage.url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});
// update controller end here

// public data controller start from here

const getMember = asyncHandler(async (req, res) => {
    try {
        const { role } = req.query;

        if (!role) {
            throw new ApiError(400, "Role query parameter is required");
        }

        const roles = ["admin", "moderator", "mentor", "member"];
        const userRole = role.trim();
        if (!roles.includes(userRole) && userRole != "all") {
            throw new ApiError(400, "Invalid role provided");
        }

        const selected = "username fullname email avatar roles";
        let search = [{ "roles.role": userRole }];
        let member = [];

        if (userRole == "moderator") {
            search = [{ "roles.role": "admin" }, { "roles.role": "moderator" }];
        }

        if (userRole == "moderator") {
            member = await User.find({
                $or: search,
            })
                .select(selected)
                .sort({ "roles.position": 1 });
        } else if (userRole == "mentor") {
            member = await User.find({
                $or: search,
            })
                .select(selected)
                .sort({ "roles.position": -1 });
        } else if (userRole == "all") {
            member = await User.find().select(selected);
        } else {
            member = await User.find({
                $or: search,
            }).select(selected);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    member,
                    `${role} data retrieved successfully`
                )
            );
    } catch (error) {
        throw new ApiError(500, "Failed to fetch member data");
    }
});

const getUserInfo = asyncHandler(async (req, res) => {
    const { username, id } = req.query;

    if (!username && !id) {
        throw new ApiError(
            400,
            "Either username or id query parameter is required"
        );
    }

    const profile = await userDataCollection(username, id);

    if (!profile || profile.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                profile[0],
                "Profile data retrieved successfully"
            )
        );
});

const getProfile = asyncHandler(async (req, res) => {
    // Fetch profile data using userDataCollection function
    const profile = await userDataCollection(req.user?.username, req.user?._id);

    if (!profile || profile.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                profile[0],
                "Profile data retrieved successfully"
            )
        );
});

// public data controller start from here

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateAvatar,
    updateCoverImage,
    getUserInfo,
    getMember,
    getProfile,
};
