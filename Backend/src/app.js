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

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
};

app.use(errorHandler);

//router part start
import userRouter from "./routes/user.route.js";
import userBlog from "./routes/blog.route.js";
import userComment from "./routes/comment.route.js";
import userDashboard from "./routes/dashboard.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", userBlog);
app.use("/api/v1/comment", userComment);
app.use("/api/v1/dashboard", userDashboard);

export { app };
