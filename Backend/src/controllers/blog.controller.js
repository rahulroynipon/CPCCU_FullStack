import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// secure blog section start from here
const createBlog = asyncHandler(async (req, res) => {
    let thumbnailLocalPath = null; // Initialize to null

    try {
        const { content } = req.body;
        thumbnailLocalPath = req.file?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail image file is missing");
        }

        if (!content || !content.trim()) {
            if (fs.existsSync(thumbnailLocalPath)) {
                fs.unlinkSync(thumbnailLocalPath);
            }
            throw new ApiError(400, "Content is missing");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail.url) {
            if (fs.existsSync(thumbnailLocalPath)) {
                fs.unlinkSync(thumbnailLocalPath);
            }
            throw new ApiError(400, "Error while uploading thumbnail");
        }

        const blog = await Blog.create({
            owner: new mongoose.Types.ObjectId(req.user._id),
            thumbnail: thumbnail.url,
            content: content,
        });

        if (!blog) {
            throw new ApiError(
                500,
                "Something went wrong while creating the blog"
            );
        }

        return res
            .status(201)
            .json(new ApiResponse(200, blog, "Blog is created successfully"));
    } catch (error) {
        if (fs.existsSync(req.file?.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw new ApiError(
            500,
            error.message || "Server error while creating blog"
        );
    }
});

const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "Invalid blog id");
    }

    const existedBlog = await Blog.findById(id);

    if (!existedBlog) {
        throw new ApiError(404, "Blog not Found");
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

        const userRole = role.trim().toLowerCase();

        let filter = {
            path: "owner",
            select: "username fullname avatar",
            search: [{ "roles.role": userRole }],
            sort: { createdAt: -1 },
        };

        switch (userRole) {
            case "admin":
            case "mentor":
            case "member":
                // No additional filtering needed
                break;
            case "moderator":
                filter.search.push({ "roles.role": "admin" });
                break;
            case "all":
                filter.search = [{}];
                break;
            default:
                throw new ApiError(400, "Invalid role provided");
        }

        let blogs = await Blog.find().populate({
            path: filter.path,
            match: { $or: filter.search },
            select: filter.select,
        });

        blogs = blogs.filter((blog) => blog.owner !== null);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    blogs,
                    `${role ? role : "All"} blogs retrieved successfully`
                )
            );
    } catch (error) {
        if (error instanceof ApiError) {
            return res
                .status(error.statusCode)
                .json(new ApiResponse(error.statusCode, null, error.message));
        } else {
            return res
                .status(500)
                .json(new ApiResponse(500, null, "Failed to fetch blogs"));
        }
    }
});

export { createBlog, updateBlog, deleteBlog, getBlog };
