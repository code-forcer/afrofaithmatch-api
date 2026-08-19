const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

/**
 * Registers all Socket.IO event handlers.
 * @param {import("socket.io").Server} io
 */
function registerSocketHandlers(io) {
  // Map: userId → socketId (for targeted delivery)
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("user_online", { userId });
      console.log(`🟢 Socket connected: userId=${userId}`);
    }

    // ── Join a conversation room ──────────────────────────────────
    socket.on("join_conversation", ({ conversationId }) => {
      socket.join(`conv_${conversationId}`);
    });

    // ── Leave a conversation room ─────────────────────────────────
    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
    });

    // ── Send a message ────────────────────────────────────────────
    socket.on("send_message", async ({ conversationId, senderId, text }) => {
      try {
        // Save to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          text,
          readBy: [senderId],
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageText: text.substring(0, 100),
          lastMessageAt: new Date(),
        });

        // Populate sender for response
        await message.populate("sender", "name avatar");

        // Broadcast to everyone in the room
        io.to(`conv_${conversationId}`).emit("message_received", {
          message,
          conversationId,
        });
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
        console.error("Socket send_message error:", err);
      }
    });

    // ── Typing indicators ─────────────────────────────────────────
    socket.on("typing", ({ conversationId, userId: typingUserId }) => {
      socket.to(`conv_${conversationId}`).emit("user_typing", {
        userId: typingUserId,
        conversationId,
      });
    });

    socket.on("stop_typing", ({ conversationId, userId: typingUserId }) => {
      socket.to(`conv_${conversationId}`).emit("user_stop_typing", {
        userId: typingUserId,
        conversationId,
      });
    });

    // ── Mark messages as read ─────────────────────────────────────
    socket.on("mark_read", async ({ conversationId, userId: readerId }) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: readerId },
            readBy: { $nin: [readerId] },
          },
          {
            $addToSet: { readBy: readerId },
            $set: { readAt: new Date() },
          }
        );
        socket.to(`conv_${conversationId}`).emit("messages_read", {
          conversationId,
          readerId,
        });
      } catch (err) {
        console.error("Socket mark_read error:", err);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("user_offline", { userId });
        console.log(`🔴 Socket disconnected: userId=${userId}`);
      }
    });
  });

  return { onlineUsers };
}

module.exports = registerSocketHandlers;
