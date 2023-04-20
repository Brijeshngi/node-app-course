import mongoose from "mongoose";

const schema = new mongoose.Schema({
  //     Title type, required, minLength, maxLength
  Title: {
    type: String,
    required: [true, "Please enter the Title of Course"],
    minLength: [8, "Please Enter minimum 8 characters"],
    maxLength: [50, "Not more than 50 characters"],
  },
  // Description type, required, minLength
  Description: {
    type: String,
    required: [true, "Please Enter the Description"],
    maxLength: [50, "Not more than 50 characters"],
  },
  // Lectures title,description,videos { public_id,url }

  Lectures: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      videos: {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    },
  ],
  // Poster public_id, url

  Poster: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  // Views type, default
  Views: {
    type: Number,
    default: 0,
  },

  // NumOfVideos type, default

  NumOfVideos: {
    type: Number,
    default: 0,
  },
  // Category type, required
  Category: {
    type: String,
    required: [true, "Please Enter Category "],
  },
  // CreatedBy type, required

  CreatedBy: {
    type: String,
    required: [true, "Please Enter name of Creator"],
  },
  // CreatedAt type, default

  CreatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model("Course", schema);
