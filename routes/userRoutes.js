import express from "express";
import {
  changePassword,
  getAllUsers,
  register,
  login,
  logout,
  getMyProfile,
  updateProfile,
  updatePicture,
  forgetPassword,
  resetPassword,
  addToPlayList,
  removeFromPlaylist,
  deleteMyProfile,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";

import { isAuthenticated, authorizeAdmin } from "../middleware/auth.js";

import singleUpload from "../middleware/multer.js";

const router = express.Router();

router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

router
  .route("/admin/users/:id")
  .put(isAuthenticated, authorizeAdmin, updateUserRole)
  .delete(isAuthenticated, authorizeAdmin, deleteUser);

router.route("/register").post(singleUpload, register);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/me").get(isAuthenticated, getMyProfile);

router.route("/me").delete(isAuthenticated, deleteMyProfile);

router.route("/changepassword").put(isAuthenticated, changePassword);

// UpdateProfile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

router
  .route("/updatepicture")
  .put(isAuthenticated, singleUpload, updatePicture);

router.route("/forgetpassword").post(forgetPassword);

router.route("/resetpassword/:token").put(resetPassword);

router.route("/addtoplaylist").post(isAuthenticated, addToPlayList);

router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

export default router;
