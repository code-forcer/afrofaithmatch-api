const Interest = require("../models/Interest");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { sendInterestEmail, sendInterestAcceptedEmail } = require("../utils/email");

// ─── Send Interest ─────────────────────────────────────────────────
exports.sendInterest = async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user._id;

    if (toUserId === fromUserId.toString()) {
      return res.status(400).json({ error: "You cannot send an interest to yourself." });
    }

    const targetUser = await User.findById(toUserId);
    if (!targetUser || targetUser.isBanned) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if already sent
    const existing = await Interest.findOne({ from: fromUserId, to: toUserId });
    if (existing) {
      return res.status(409).json({ error: "You already sent an interest to this person.", status: existing.status });
    }

    const interest = await Interest.create({
      from: fromUserId,
      to: toUserId,
      message: message || "",
    });

    // Notify recipient via email (non-blocking)
    sendInterestEmail(targetUser, req.user).catch((err) =>
      console.error("Interest email failed:", err.message)
    );

    res.status(201).json({ interest, message: "Interest sent successfully!" });
  } catch (err) {
    console.error("Send interest error:", err);
    res.status(500).json({ error: "Failed to send interest." });
  }
};

// ─── Get Interests Received ────────────────────────────────────────
exports.getReceivedInterests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { to: req.user._id };
    if (status) filter.status = status;

    const interests = await Interest.find(filter)
      .populate("from", "name avatar lastActive")
      .sort({ createdAt: -1 });

    res.json({ interests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch interests." });
  }
};

// ─── Get Interests Sent ────────────────────────────────────────────
exports.getSentInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ from: req.user._id })
      .populate("to", "name avatar lastActive")
      .sort({ createdAt: -1 });

    res.json({ interests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sent interests." });
  }
};

// ─── Accept Interest ───────────────────────────────────────────────
exports.acceptInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const interest = await Interest.findById(id);

    if (!interest || interest.to.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Interest not found." });
    }

    if (interest.status !== "pending") {
      return res.status(400).json({ error: `Interest already ${interest.status}.` });
    }

    interest.status = "accepted";
    await interest.save();

    // Create conversation between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: [interest.from, interest.to] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [interest.from, interest.to],
      });
    }

    // Notify the sender (non-blocking)
    const sender = await User.findById(interest.from);
    sendInterestAcceptedEmail(sender, req.user).catch((err) =>
      console.error("Accept email failed:", err.message)
    );

    res.json({ interest, conversation, message: "Interest accepted! You can now chat." });
  } catch (err) {
    console.error("Accept interest error:", err);
    res.status(500).json({ error: "Failed to accept interest." });
  }
};

// ─── Reject Interest ───────────────────────────────────────────────
exports.rejectInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const interest = await Interest.findById(id);

    if (!interest || interest.to.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Interest not found." });
    }

    interest.status = "rejected";
    await interest.save();

    res.json({ message: "Interest declined." });
  } catch (err) {
    res.status(500).json({ error: "Failed to decline interest." });
  }
};
