import mongoose from "mongoose";
import Validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema({
  //     Name type, required
  Name: {
    type: String,
    required: [true, "Please Enter your Name "],
  },

  // Email type, required, unique, validate
  Email: {
    type: String,
    required: [true, "Please Enter your Email"],
    unique: true,
    validate: Validator.isEmail,
  },
  // Password type, required, minLength, select
  Password: {
    type: String,
    required: [true, "Please Enter your Password"],
    minlength: [8, "Password must be of minimum 8 character"],
    select: false,
  },
  // Role type, enum, default
  Role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  // Subscription id, status
  Subscription: {
    id: String,
    status: String,
  },
  // Avatar public_id, url
  Avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  // Playlist [ courseId,poster ]
  Playlist: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  // CreatedAt type, default
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  // ResetPasswordToken type
  ResetPasswordToken: String,
  // ResetPasswordExpire type
  ResetPasswordExpire: String,
});

schema.pre("save", async function (next) {
  if (!this.isModified("Password")) return next();
  this.Password = await bcrypt.hash(this.Password, 10);
  next();
});

schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

schema.methods.comparePassword = async function (Password) {
  return await bcrypt.compare(Password, this.Password);
};

// for testing on console that generates resetToken

console.log(crypto.randomBytes(20).toString("hex"));

schema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.ResetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.ResetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model("User", schema);
