const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// ─── Get my conversations ──────────────────────────────────────────
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name avatar lastActive")
      .populate("lastMessage", "text createdAt sender")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
};

// ─── Get messages in a conversation ───────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: id,
        sender: { $ne: req.user._id },
        readBy: { $nin: [req.user._id] },
      },
      {
        $addToSet: { readBy: req.user._id },
        $set: { readAt: new Date() },
      }
    );

    res.json({
      messages: messages.reverse(), // Chronological order
      page: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

// ─── Send message via REST (fallback from Socket.IO) ──────────────
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Message text is required." });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const message = await Message.create({
      conversation: id,
      sender: req.user._id,
      text: text.trim(),
      readBy: [req.user._id],
    });

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: message._id,
      lastMessageText: text.substring(0, 100),
      lastMessageAt: new Date(),
    });

    await message.populate("sender", "name avatar");

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
};
