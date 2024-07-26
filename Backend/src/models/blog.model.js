import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Blog = mongoose.model("Blog", blogSchema);
