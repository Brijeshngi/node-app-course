import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return next(new ErrorHandler("All fields are required", 400));

  const To = process.env.MY_MAIL;
  const Subject = "Regarding course";
  const Text = `I am ${name} and my email is ${email}. \n${message}`;

  await sendEmail(To, Subject, Text);

  res.status(200).json({
    success: true,
    message: "Your message has been sent, will be contacted shortly",
  });
});

export const requestCourse = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course)
    return next(new ErrorHandler("please provide all details", 400));

  const To = process.env.MY_MAIL;
  const Subject = "Course Request";
  const Text = `I am ${name} and my email is ${email}. \n Please provide ${course} to me.`;

  await sendEmail(To, Subject, Text);

  res.status(200).json({
    success: true,
    message:
      "Your course request has been sent.It will be provided shortly on your profile",
  });
});

export const getDashboard = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
  });
});
