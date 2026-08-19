const Contact = require("../models/Contact");
const { sendContactConfirmation, sendAdminContactAlert } = require("../utils/email");

// ─── Submit contact form ───────────────────────────────────────────
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const contact = await Contact.create({ name, email, subject, message });

    // Send confirmation to user + alert admin (non-blocking)
    sendContactConfirmation(contact).catch((err) =>
      console.error("Contact confirmation email failed:", err.message)
    );
    sendAdminContactAlert(contact).catch((err) =>
      console.error("Admin alert email failed:", err.message)
    );

    res.status(201).json({ message: "Message sent! We'll get back to you shortly." });
  } catch (err) {
    console.error("Contact submit error:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
};
