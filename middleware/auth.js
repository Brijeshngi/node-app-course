import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new ErrorHandler("Not logged in", 400));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded._id);

  next();
});

export const authorizeAdmin = (req, res, next) => {
  if (req.user.Role !== "admin")
    return next(
      new ErrorHandler(
        `${req.user.Role} is not allowed to access this resourse`,
        403
      )
    );
  next();
};

export const authorizeSubscribers = (req, res, next) => {
  if (req.user.Subscription.status !== "active" && req.user.Role !== "admin")
    return next(
      new ErrorHandler(`Only Subscribers can access thiss resourse`, 403)
    );
  next();
};
