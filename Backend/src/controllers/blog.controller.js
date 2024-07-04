import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// secure blog section start from here
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

const updateBlog = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Update content is required");
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.blog._id,
            { $set: { content: content } },
            { new: true }
        );

        if (!updatedBlog) {
            throw new ApiError(500, "Failed to update blog");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedBlog, "Blog updated successfully")
            );
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "server site error while updting the blog"
        );
    }
});

const deleteBlog = asyncHandler(async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.blog._id);

        if (!deletedBlog) {
            throw new ApiError(500, "Failed to delete blog");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Blog deleted successfully"));
    } catch (error) {
        console.error("Error deleting blog:", error); // Logging the error for debugging
        throw new ApiError(
            500,
            error?.message || "Server side error while deleting the blog"
        );
    }
});
// secure blog section end here

// get blog section start here
const getBlog = asyncHandler(async (req, res) => {
    try {
        const { role } = req.query;

        if (!role) {
            throw new ApiError(400, "Role query parameter is required");
        }

        const roles = ["admin", "moderator", "mentor", "member"];
        const userRole = role.trim().toLowerCase();

        if (!roles.includes(userRole) && userRole !== "all") {
            throw new ApiError(400, "Invalid role provided");
        }

        let blogs = [];
        const selected = "username fullname avatar";
        let search = [{ "roles.role": userRole }];

        if (userRole === "moderator") {
            search = [{ "roles.role": "admin" }, { "roles.role": "moderator" }];
        }

        if (userRole === "all") {
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

            // Filter out blogs where owner is null
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

export { createBlog, updateBlog, deleteBlog, getBlog };
