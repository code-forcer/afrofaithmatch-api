const Newsletter = require("../models/Newsletter");
const { sendNewsletterWelcome } = require("../utils/email");

// ─── Subscribe ─────────────────────────────────────────────────────
exports.subscribe = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.active) {
        return res.status(409).json({ error: "This email is already subscribed." });
      }
      // Re-activate
      existing.active = true;
      await existing.save();
      return res.json({ message: "Welcome back! Your subscription has been re-activated." });
    }

    const subscriber = await Newsletter.create({ email, name: name || "" });

    sendNewsletterWelcome(subscriber).catch((err) =>
      console.error("Newsletter welcome email failed:", err.message)
    );

    res.status(201).json({ message: "Thank you for subscribing! 🙏" });
  } catch (err) {
    res.status(500).json({ error: "Failed to subscribe." });
  }
};

// ─── Unsubscribe by token ──────────────────────────────────────────
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Unsubscribe token is required." });
    }

    const subscriber = await Newsletter.findOne({ unsubscribeToken: token });
    if (!subscriber) {
      return res.status(404).json({ error: "Invalid unsubscribe link." });
    }

    subscriber.active = false;
    await subscriber.save();

    res.json({ message: "You have been unsubscribed successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to unsubscribe." });
  }
};
