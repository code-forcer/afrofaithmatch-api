const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
} = require("../controllers/conversationsController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getConversations);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

module.exports = router;
