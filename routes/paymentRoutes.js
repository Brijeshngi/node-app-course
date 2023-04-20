import express from "express";
import {
  buySubscription,
  cancelSubscription,
  getRazorpayKey,
} from "../controllers/paymentController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/subscribe").get(isAuthenticated, buySubscription);

router.route("/paymentverification").post(isAuthenticated);

router.route("/razorpaykey").get(getRazorpayKey);

router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;
