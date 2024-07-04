import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createBlog = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is missing");
    }

    const blog = await Blog.create({
        owner: new mongoose.Types.ObjectId(req.user._id),
        content: content,
    });

    if (!blog) {
        throw new ApiError(500, "Something went wrong while creating the blog");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, blog, "Blog is created successfully"));
});

const getBlog = asyncHandler(async (req, res) => {
    try {
        const { role } = req.query;

        if (!role) {
            throw new ApiError(400, "Role query parameter is required");
        }

        const roles = ["admin", "moderator", "mentor", "member"];
        const userRole = role.trim();
        if (!roles.includes(userRole)) {
            throw new ApiError(400, "Invalid role provided");
        }

        let blogs = [];
        let search = [{ "roles.role": userRole }];
        const selected = "username fullname avatar";

        if (userRole == "moderator") {
            search = [{ "roles.role": "admin" }, { "roles.role": "moderator" }];
        }

        if (userRole == "all") {
            blogs = await Blog.find()
                .populate({
                    path: "owner",
                    select: selected,
                })
                .sort({ createdAt: -1 });
        } else {
            blogs = await Blog.find()
                .populate({
                    path: "owner",
                    match: { $or: search },
                    select: selected,
                })
                .sort({ createdAt: -1 });
            blogs = blogs.filter((blog) => blog.owner !== null);
        }

        res.status(200).json(
            new ApiResponse(
                200,
                blogs,
                `${role ? role : "All"} blogs retrieved successfully`
            )
        );
    } catch (error) {
        res.status(500).json(new ApiError(500, "Failed to fetch blogs"));
    }
});

export { createBlog, getBlog };
