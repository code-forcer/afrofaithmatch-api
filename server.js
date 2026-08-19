require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const registerSocketHandlers = require("./utils/socket");

// ─── Routes ───────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const interestsRoutes = require("./routes/interests");
const conversationsRoutes = require("./routes/conversations");
const blogRoutes = require("./routes/blog");
const contactRoutes = require("./routes/contact");
const newsletterRoutes = require("./routes/newsletter");
const adminRoutes = require("./routes/admin");

// ─── Connect to MongoDB ────────────────────────────────────────────
connectDB();

// ─── App setup ────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
registerSocketHandlers(io);

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// CORS — allow frontend origin
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

// Rate limiting — general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests. Please try again later." },
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── API Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/interests", interestsRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);

// ─── Health Check ──────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    app: "Afro Faith Match API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max size is 5MB." });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error.",
  });
});

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║    ✝ Afro Faith Match API v1.0.0        ║
  ║    🚀 Running on port ${PORT}              ║
  ║    📡 Socket.IO enabled                  ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
