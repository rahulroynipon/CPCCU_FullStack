import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

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

const getAllBlog = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({}).populate({
        path: "owner",
        select: "username fullname avatar ",
    });

    return res.status(200).json(new ApiResponse(200, blogs, "all the blogs"));
});

export { createBlog, getAllBlog };
