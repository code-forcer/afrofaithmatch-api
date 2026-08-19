const express = require("express");
const router = express.Router();
const {
  sendInterest,
  getReceivedInterests,
  getSentInterests,
  acceptInterest,
  rejectInterest,
} = require("../controllers/interestsController");
const { protect } = require("../middleware/auth");

router.post("/", protect, sendInterest);
router.get("/received", protect, getReceivedInterests);
router.get("/sent", protect, getSentInterests);
router.put("/:id/accept", protect, acceptInterest);
router.put("/:id/reject", protect, rejectInterest);

module.exports = router;
