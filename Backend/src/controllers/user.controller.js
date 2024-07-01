import asyncHandler from "./../utils/asyncHandler.js";
import { ApiError } from "./../utils/ApiError.js";
import { ApiResponse } from "./../utils/ApiResponse.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudinary } from "./../utils/cloudinary.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password, batch, uni_id } = req.body;

    if (
        [username, email, fullname, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        if (fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        throw new ApiError(409, "User with email or username already exists");
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        batch,
        uni_id,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

export { registerUser };
