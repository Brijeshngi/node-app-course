import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { instance } from "../server.js";
import ErrorHandler from "../utils/errorHandler.js";

export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.Role === "admin")
    return next(new ErrorHandler("Admin can't buy subscription", 409));

  const plan_id = process.env.PLAN_ID || "plan_LdBbWKLFWoxg5u";

  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });
  user.Subscription.id = subscription.id;

  user.Subscription.status = subscription.status;

  await user.save();

  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.Subscription.id;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;

  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  //   databse communication starts here

  await PaymentMethodChangeEvent.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  user.Subscription.status = "active";

  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorpayKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscriptionId = user.Subscription.id;

  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const numOfDays = Date.now() - payment.createdAt;

  const refundDays = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

  if (refundDays > numOfDays) {
    await instance.payments.refund(payment.razorpay_payment_id);

    refund = true;
  }

  await payment.remove();

  user.Subscription.id = undefined;
  user.Subscription.status = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: refund
      ? "subscription cancelled, refund in 24 hours"
      : " subscription cancel request accepted, but unfortunate no refund will be done",
  });
});
