import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";

export const register = catchAsyncError(async (req, res, next) => {
  const { Name, Email, Password } = req.body;

  const file = req.file;

  if (!Name || !Email || !Password || !file)
    return next(new ErrorHandler("Please add all fields", 400));

  let user = await User.findOne({ Email });

  if (user) return next(new ErrorHandler("User Already Exist", 409));

  //upload file on Cloudinary;

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  user = await User.create({
    Name,
    Email,
    Password,
    Avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, 201);
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.Avatar.public_id);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "Your Profile deleted successfully, Hope you come back soon",
  });
});

export const login = catchAsyncError(async (req, res, next) => {
  const { Email, Password } = req.body;

  if (!Email || !Password)
    return next(new ErrorHandler("Please Enter All field", 400));

  const user = await User.findOne({ Email }).select("+Password");

  if (!user) return next(new ErrorHandler("Incorrect Email or Password", 401));

  const isMatch = await user.comparePassword(Password);

  if (!isMatch)
    return next(new ErrorHandler("Incorrect Email or Password", 401));

  sendToken(res, user, `Welcome Back, ${user.Name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged out Succesfully",
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please Enter All field", 400));

  const user = await User.findById(req.user._id).select("+Password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) return next(new ErrorHandler("Incorrect old Password", 400));

  user.Password = newPassword;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    user,
  });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { Name, Email } = req.body;

  const user = await User.findByIdAndUpdate(req.user._id);

  user.Name = Name;
  user.Email = Email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

export const updatePicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;

  const user = await User.findById(req.user._id);

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.destroy(user.Avatar.public_id);

  const cloud = await cloudinary.v2.uploader.upload(fileUri.content);

  console.log(mycloud.public_id);

  user.Avatar = {
    public_id: cloud.public_id,
    url: cloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Pictutre updated",
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { Email } = req.body;

  if (!Email) return next(new ErrorHandler("Please provide Email", 400));

  const user = await User.findOne({ Email });

  if (!user)
    return next(
      new ErrorHandler("User not found, Please provide Correct Email", 400)
    );

  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `click on the link to reset your password. ${url}`;

  //send token using email

  await sendEmail(user.Email, "Reset Password", message);
  // ///////////////////////////////////////////////////////

  res.status(200).json({
    success: true,
    message: `Reset token sent to ${user.Email}`,
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const ResetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    ResetPasswordToken,
    ResetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) return next(new ErrorHandler("Token has been Expired", 401));

  user.Password = req.body.Password;
  user.ResetPasswordToken = undefined;
  user.ResetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

export const addToPlayList = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course)
    return next(new ErrorHandler("Invalid Course, Course not found", 404));

  const itemExist = user.Playlist.find((item) => {
    if (item.courseId.toString() === course._id.toString()) return true;
  });

  if (itemExist) return next(new ErrorHandler("Item Already Exist", 409));

  user.Playlist.push({
    course: course._id,
    poster: course.Poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Added to playlist",
  });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);

  if (!course) return next(new ErrorHandler("Invalid Course Id", 404));
  // //////////////////////////////////////////////////////////
  const numberOfCourse = user.Playlist.length;

  console.log(numberOfCourse);

  if (numberOfCourse <= 0)
    return next(new ErrorHandler("No course found", 404));
  if (course._id === undefined) return next(("No course", 404));
  // ////////////////////////////////////////////////////////////
  const newPlaylist = user.Playlist.filter((item) => {
    if (item.courseId.toString() !== course._id.toString()) return item;
  });

  user.Playlist = newPlaylist;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Removed from Playlist",
  });
});

// admin controllers

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("user not found", 404));

  if (user.Role === "user") user.Role = "admin";
  else user.Role = "user";

  await user.save();

  res.status(200).json({
    success: true,
    message: "Role hass been updated",
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("user not found", 404));

  await cloudinary.v2.uploader.destroy(user.Avatar.public_id);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
