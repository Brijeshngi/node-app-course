import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";

export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const courses = await Course.find().select("-Lectures");
  res.status(200).json({
    success: true,
    courses,
  });
});

export const createcourse = catchAsyncError(async (req, res, next) => {
  const { Title, Description, Category, CreatedBy } = req.body;

  if (!Title || !Description || !Category || !CreatedBy)
    return next(new ErrorHandler("Please add all fields", 400));

  const file = req.file;

  // console.log(file);
  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    Title,
    Description,
    Category,
    CreatedBy,
    Poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: "Course created successfully",
  });
});

export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("course not found", 404));

  course.Views += 1;

  await course.save();

  res.status(200).json({
    success: true,
    lectures: course.Lectures,
  });
});

export const addLecture = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const { Title, Description } = req.body;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("course not found", 404));

  const file = req.file;

  // console.log(file);

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.Lectures.push({
    Title,
    Description,
    videos: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  course.NumOfVideos = course.Lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture added in Course",
  });
});

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("course not found", 404));

  await cloudinary.v2.uploader.destroy(course.Poster.public_id);

  for (let i = 0; i < course.Lectures.length; i++) {
    const singleLecture = course.Lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.videos.public_id, {
      resource_type: "video",
    });
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course Deleted Successfully",
  });
});

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course not found", 404));

  const lecture = course.Lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  await cloudinary.v2.uploader.destroy(lecture.videos.public_id, {
    resource_type: "video",
  });

  course.Lectures = course.Lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.NumOfVideos = course.Lectures.length;

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
});
