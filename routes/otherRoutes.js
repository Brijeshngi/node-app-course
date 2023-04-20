import express from "express";
import {
  getDashboard,
  contact,
  requestCourse,
} from "../controllers/otherController.js";
import { authorizeAdmin, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// contact
router.route("/contact").post(contact);

// request a Course

router.route("/requestcourse").post(requestCourse);

// Admin Dashboard

router
  .route("/admin/dashboard")
  .get(isAuthenticated, authorizeAdmin, getDashboard);

export default router;
