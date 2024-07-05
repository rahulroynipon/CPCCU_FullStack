import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "./../utils/asyncHandler.js";
import { Blog } from "./../models/blog.model.js";
import { Comment } from "./../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createComment = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const { content } = req.body;

    if (!content || !id) {
        throw new ApiError(400, "Content and blog id both are required");
    }

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "Invalid blog id");
    }

    const existedBlog = await Blog.findById(id.trim());

    if (!existedBlog) {
        throw new ApiError(404, "This blog does not exist");
    }

    const comment = await Comment.create({
        blog: id.trim(),
        owner: req.user._id,
        content: content,
    });

    if (!comment) {
        throw new ApiError(500, "Server error while creating the comment");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (!id) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id.trim())) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existedcomment = await Comment.findById(id.trim());

    if (!existedcomment) {
        throw new ApiError(404, "Comment not found");
    }

    if (existedcomment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    const comment = await Comment.findByIdAndDelete(id.trim());

    if (!comment) {
        throw new ApiError(500, "server error while deleting the comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { createComment, deleteComment };
