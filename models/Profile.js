const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say"],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    denomination: {
      type: String,
      enum: [
        "Catholic",
        "Baptist",
        "Anglican",
        "Pentecostal",
        "Methodist",
        "Presbyterian",
        "Seventh-day Adventist",
        "Evangelical",
        "Non-denominational",
        "Orthodox",
        "Other",
      ],
      default: null,
    },
    churchAttendance: {
      type: String,
      enum: [
        "Every week",
        "Few times a month",
        "Occasionally",
        "Rarely",
        "Never",
      ],
      default: null,
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Divorced", "Widowed", "Separated"],
      default: "Single",
    },
    relationshipGoal: {
      type: String,
      enum: ["Marriage", "Friendship", "Dating", "Not sure yet"],
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    photos: [
      {
        url: String,
        publicId: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    lookingFor: {
      type: String,
      enum: ["male", "female", "both"],
      default: null,
    },
    ageRangeMin: {
      type: Number,
      default: 18,
    },
    ageRangeMax: {
      type: Number,
      default: 60,
    },
    height: {
      type: String,
      default: "",
    },
    occupation: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      enum: [
        "High School",
        "Some College",
        "Associate Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "Doctorate",
        "Trade School",
        "Other",
        "",
      ],
      default: "",
    },
    languages: [{ type: String }],
    profileViews: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Virtual age field
profileSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

profileSchema.set("toJSON", { virtuals: true });
profileSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Profile", profileSchema);
