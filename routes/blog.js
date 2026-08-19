const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/blogController");
const { protect } = require("../middleware/auth");
const { adminProtect } = require("../middleware/adminAuth");
const { uploadBlogCover } = require("../middleware/upload");

// Public
router.get("/", getPosts);
router.get("/:slug", getPost);

// Admin only
router.post("/", adminProtect, uploadBlogCover.single("coverImage"), createPost);
router.put("/:id", adminProtect, uploadBlogCover.single("coverImage"), updatePost);
router.delete("/:id", adminProtect, deletePost);

module.exports = router;
