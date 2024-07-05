import asyncHandler from "./../utils/asyncHandler.js";
import { ApiError } from "./../utils/ApiError.js";
import { ApiResponse } from "./../utils/ApiResponse.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudinary } from "./../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Blog } from "../models/blog.model.js";
import { Comment } from "../models/comment.model.js";

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
        { $match: query },
        {
            $lookup: {
                from: "blogs",
                localField: "_id",
                foreignField: "owner",
                as: "personalBlogs",
            },
        },
        {
            $unwind: {
                path: "$personalBlogs",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "personalBlogs._id",
                foreignField: "blog",
                as: "personalBlogs.comments",
            },
        },
        {
            $unwind: {
                path: "$personalBlogs.comments",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "personalBlogs.comments.owner",
                foreignField: "_id",
                as: "personalBlogs.comments.commenter",
            },
        },
        {
            $unwind: {
                path: "$personalBlogs.comments.commenter",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: {
                    userId: "$_id",
                    blogId: "$personalBlogs._id",
                },
                username: { $first: "$username" },
                email: { $first: "$email" },
                fullname: { $first: "$fullname" },
                avatar: { $first: "$avatar" },
                coverImage: { $first: "$coverImage" },
                uni_id: { $first: "$uni_id" },
                batch: { $first: "$batch" },
                blogContent: { $first: "$personalBlogs.content" },
                blogCreatedAt: { $first: "$personalBlogs.createdAt" },
                comments: {
                    $push: {
                        _id: "$personalBlogs.comments._id",
                        content: "$personalBlogs.comments.content",
                        createdAt: "$personalBlogs.comments.createdAt",
                        commenter: {
                            _id: "$personalBlogs.comments.commenter._id",
                            username:
                                "$personalBlogs.comments.commenter.username",
                            fullname:
                                "$personalBlogs.comments.commenter.fullname",
                            avatar: "$personalBlogs.comments.commenter.avatar",
                        },
                    },
                },
            },
        },
        {
            $group: {
                _id: "$_id.userId",
                username: { $first: "$username" },
                email: { $first: "$email" },
                fullname: { $first: "$fullname" },
                avatar: { $first: "$avatar" },
                coverImage: { $first: "$coverImage" },
                uni_id: { $first: "$uni_id" },
                batch: { $first: "$batch" },
                personalBlogs: {
                    $push: {
                        _id: "$_id.blogId",
                        content: "$blogContent",
                        createdAt: "$blogCreatedAt",
                        comments: "$comments",
                    },
                },
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
                personalBlogs: {
                    $filter: {
                        input: "$personalBlogs",
                        as: "blog",
                        cond: { $ne: ["$$blog", null] },
                    },
                },
            },
        },
        {
            $unwind: {
                path: "$personalBlogs",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $sort: {
                "personalBlogs.createdAt": -1, // Sort blogs by createdAt descending
            },
        },
        {
            $group: {
                _id: "$_id",
                username: { $first: "$username" },
                email: { $first: "$email" },
                fullname: { $first: "$fullname" },
                avatar: { $first: "$avatar" },
                coverImage: { $first: "$coverImage" },
                uni_id: { $first: "$uni_id" },
                batch: { $first: "$batch" },
                personalBlogs: { $push: "$personalBlogs" },
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

    const loggedInUser = await User.findById(user?._id).select("_id");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, loggedInUser, "User logged In Successfully")
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

// admin and moderator controller start from here

const changeRole = asyncHandler(async (req, res) => {
    const { change } = req.query;
    const { id, value } = req.body;

    if (!change || !id || !value) {
        throw new ApiError(400, "query, id, and value are required");
    }

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "invalid id");
    }

    const existedUser = await User.findById(id.trim());

    if (!existedUser) {
        throw new ApiError(404, "user not found");
    }

    let updateValue = value.trim();

    switch (change.trim()) {
        case "role": {
            if (
                !["admin", "moderator", "mentor", "member"].includes(
                    updateValue
                )
            ) {
                throw new ApiError(401, "invalid role");
            }
            break;
        }

        case "position": {
            const x = Number(updateValue);
            if (isNaN(x)) {
                throw new ApiError(401, "invalid position");
            }
            updateValue = x;
            break;
        }

        case "positionName": {
            // Add any additional validation if necessary
            break;
        }

        default:
            throw new ApiError(400, "invalid change type");
    }

    const updateUser = await User.findByIdAndUpdate(
        id.trim(),
        { $set: { [`roles.${change.trim()}`]: updateValue } },
        { new: true }
    ).select("username roles");

    if (!updateUser) {
        throw new ApiError(500, "failed to update user");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            updateUser,
            `${change.trim()} changed successfully`
        )
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "Invalid ID");
    }

    const existedUser = await User.findById(id.trim());

    if (!existedUser) {
        throw new ApiError(404, "User not found");
    }

    try {
        // Find all blogs owned by the user
        const allBlogs = await Blog.find({ owner: id.trim() }).select("_id");
        const blogIds = allBlogs.map((blog) => blog._id.toString());

        // Delete all comments on the user's blogs
        const deleteAllBlogComments = await Comment.deleteMany({
            $or: [{ blog: { $in: blogIds } }, { owner: id.trim() }],
        });

        // Delete all blogs owned by the user
        const deleteAllBlogs = await Blog.deleteMany({ owner: id.trim() });

        // Delete the user
        await User.findByIdAndDelete(id.trim());

        // Response with details of deletion
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    deletedBlogsCount: deleteAllBlogs.deletedCount,
                    deletedBlogCommentsCount:
                        deleteAllBlogComments.deletedCount,
                },
                "User and associated data deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "server error while deleting the user"
        );
    }
});

const deleteBlogByModerator = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (!id) {
        throw new ApiError(400, "blog is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "Invalid id");
    }

    try {
        const blog = await Blog.findById(id.trim());

        if (!blog) {
            throw new ApiError(404, "Blog not found");
        }

        await Comment.deleteMany({ blog: id.trim() });
        await Blog.findByIdAndDelete(id.trim());

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "delete the blog successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "server error while deleting the blog"
        );
    }
});

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
    changeRole,
    deleteUser,
    deleteBlogByModerator,
};
