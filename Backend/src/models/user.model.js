import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const roleSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["admin", "moderator", "mentor", "member"],
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
        positionName: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const userSchema = new Schema(
    {

        // #CHANGE-01
        // username ta google er moto email theke scrap kore deya jete pare
        // opt 1 - email er username
        //      ex- ashiq123@gmail.com => [ashiq123]
        // opt 2 - full name ke lowercase kore whitespace remove kore join kore deya + number add kore deya
        //      ex- Md Shoriful Islam Ashiq => [mdshorifulislamashiq]

        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        avatar: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        batch: {
            type: String,
            required: true,
        },
        uni_id: {
            type: String,
            required: true,
        },
        roles: {
            type: roleSchema,
            default: { role: "member", position: 0, positionName: "member" },
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SCRECT,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SCRECT,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        }
    );
};

export const User = mongoose.model("User", userSchema);
