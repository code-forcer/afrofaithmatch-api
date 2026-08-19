const express = require("express");
const router = express.Router();
const {
  browseProfiles,
  getUserProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  setMainPhoto,
  publicBrowseProfiles,
  getPublicUserProfile,
} = require("../controllers/usersController");
const { protect } = require("../middleware/auth");
const { uploadProfilePhoto } = require("../middleware/upload");

// Public routes
router.get("/public/browse", publicBrowseProfiles);
router.get("/public/:id", getPublicUserProfile);

// Protected routes
router.get("/browse", protect, browseProfiles);
router.get("/:id", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/photos", protect, uploadProfilePhoto.single("photo"), uploadPhoto);
router.delete("/profile/photos/:photoId", protect, deletePhoto);
router.put("/profile/photos/:photoId/main", protect, setMainPhoto);

module.exports = router;
