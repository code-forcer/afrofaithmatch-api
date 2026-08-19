const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Blog = require("../models/Blog");
const Contact = require("../models/Contact");
const Newsletter = require("../models/Newsletter");
const Interest = require("../models/Interest");
const Message = require("../models/Message");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// ─── Admin Login ───────────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    // Find or create admin user in DB
    let admin = await User.findOne({ email }).select("+password");
    if (!admin) {
      admin = await User.create({
        name: "Super Admin",
        email,
        password,
        role: "admin",
      });
    } else if (admin.role !== "admin") {
      admin.role = "admin";
      await admin.save({ validateBeforeSave: false });
    }

    const token = generateToken(admin._id);

    res.json({
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Admin login failed." });
  }
};

// ─── Dashboard Stats ───────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalBlogPosts,
      publishedPosts,
      totalContacts,
      unreadContacts,
      totalSubscribers,
      activeSubscribers,
      totalInterests,
      acceptedMatches,
      totalMessages,
      recentUsers,
      recentContacts,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isBanned: false }),
      User.countDocuments({ isBanned: true }),
      Blog.countDocuments(),
      Blog.countDocuments({ published: true }),
      Contact.countDocuments(),
      Contact.countDocuments({ read: false }),
      Newsletter.countDocuments(),
      Newsletter.countDocuments({ active: true }),
      Interest.countDocuments(),
      Interest.countDocuments({ status: "accepted" }),
      Message.countDocuments(),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("name email avatar createdAt isBanned"),
      Contact.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalBlogPosts,
        publishedPosts,
        totalContacts,
        unreadContacts,
        totalSubscribers,
        activeSubscribers,
        totalInterests,
        acceptedMatches,
        totalMessages,
      },
      recentUsers,
      recentContacts,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data." });
  }
};

// ─── List All Users ────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, banned } = req.query;

    const filter = { role: "user" };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }
    if (banned !== undefined) filter.isBanned = banned === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password");

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

// ─── Ban / Unban User ──────────────────────────────────────────────
exports.toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot ban admin." });

    user.isBanned = !user.isBanned;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `User ${user.isBanned ? "banned" : "unbanned"} successfully.`, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
};

// ─── Delete User ───────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot delete admin." });

    await User.findByIdAndDelete(id);
    await Profile.findOneAndDelete({ userId: id });

    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
};

// ─── Get All Contacts ──────────────────────────────────────────────
exports.getContacts = async (req, res) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (read !== undefined) filter.read = read === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Contact.countDocuments(filter);

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ contacts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts." });
  }
};

// ─── Mark Contact as Read ──────────────────────────────────────────
exports.markContactRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!contact) return res.status(404).json({ error: "Contact not found." });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: "Failed to update contact." });
  }
};

// ─── Get All Newsletter Subscribers ───────────────────────────────
exports.getSubscribers = async (req, res) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (active !== undefined) filter.active = active === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Newsletter.countDocuments(filter);

    const subscribers = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ subscribers, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subscribers." });
  }
};

// ─── Admin Blog – Get All (incl. drafts) ──────────────────────────
exports.getAllBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Blog.countDocuments();

    const posts = await Blog.find()
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content");

    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog posts." });
  }
};
