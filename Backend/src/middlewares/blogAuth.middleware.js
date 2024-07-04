import asyncHandler from "./../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";

const verifyBlogOwner = asyncHandler(async (req, res, next) => {
    const { id } = req.query;

    if (!id) {
        throw new ApiError(400, "Blog ID is required");
    }

    const blog = await Blog.findById(id.trim());

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    if (req.user._id.toString() !== blog.owner.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update or delete this blog"
        );
    }

    req.blog = blog;
    next();
});

export { verifyBlogOwner };
