import mongoose, { Schema, model } from "mongoose";

const commentSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: User,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
