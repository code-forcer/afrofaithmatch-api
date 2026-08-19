const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: [200, "Interest message cannot exceed 200 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate interests from same user to same target
interestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("Interest", interestSchema);
