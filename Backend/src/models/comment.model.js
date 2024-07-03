import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        content: {
            type: String,
            required: true,
        },
        blog: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
