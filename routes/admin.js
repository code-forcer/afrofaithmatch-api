const express = require("express");
const router = express.Router();
const {
  adminLogin,
  getDashboard,
  listUsers,
  toggleBanUser,
  deleteUser,
  getContacts,
  markContactRead,
  getSubscribers,
  getAllBlogPosts,
} = require("../controllers/adminController");
const {
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/blogController");
const { adminProtect } = require("../middleware/adminAuth");
const { uploadBlogCover } = require("../middleware/upload");

// Public admin login
router.post("/login", adminLogin);

// All below require admin JWT
router.get("/dashboard", adminProtect, getDashboard);

// Users
router.get("/users", adminProtect, listUsers);
router.put("/users/:id/ban", adminProtect, toggleBanUser);
router.delete("/users/:id", adminProtect, deleteUser);

// Contacts
router.get("/contacts", adminProtect, getContacts);
router.put("/contacts/:id/read", adminProtect, markContactRead);

// Newsletter
router.get("/newsletter", adminProtect, getSubscribers);

// Blog (admin panel view + CRUD)
router.get("/blog", adminProtect, getAllBlogPosts);
router.post("/blog", adminProtect, uploadBlogCover.single("coverImage"), createPost);
router.put("/blog/:id", adminProtect, uploadBlogCover.single("coverImage"), updatePost);
router.delete("/blog/:id", adminProtect, deletePost);

module.exports = router;
