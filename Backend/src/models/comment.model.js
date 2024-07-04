import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        blog: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
