import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { LIMIT } from "./constants.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

app.use(express.json({ limit: LIMIT }));
app.use(express.urlencoded({ extended: true, limit: LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

//router part start
import userRouter from "./routes/user.route.js";
import userBlog from "./routes/blog.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", userBlog);

export { app };
