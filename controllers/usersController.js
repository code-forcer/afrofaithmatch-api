const User = require("../models/User");
const Profile = require("../models/Profile");
const { deleteFromCloudinary } = require("../middleware/upload");

// ─── Browse profiles (with filters) ───────────────────────────────
exports.browseProfiles = async (req, res) => {
  try {
    const {
      gender,
      country,
      denomination,
      minAge,
      maxAge,
      maritalStatus,
      relationshipGoal,
      page = 1,
      limit = 12,
    } = req.query;

    // Build profile filter
    const profileFilter = {};
    if (gender) profileFilter.gender = gender;
    if (country) profileFilter.country = new RegExp(country, "i");
    if (denomination) profileFilter.denomination = denomination;
    if (maritalStatus) profileFilter.maritalStatus = maritalStatus;
    if (relationshipGoal) profileFilter.relationshipGoal = relationshipGoal;

    // Age filter using dateOfBirth
    if (minAge || maxAge) {
      const today = new Date();
      profileFilter.dateOfBirth = {};
      if (maxAge) {
        const minDate = new Date(today.getFullYear() - parseInt(maxAge), today.getMonth(), today.getDate());
        profileFilter.dateOfBirth.$gte = minDate;
      }
      if (minAge) {
        const maxDate = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate());
        profileFilter.dateOfBirth.$lte = maxDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await Profile.find(profileFilter)
      .populate("userId", "name avatar email lastActive isBanned")
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out banned users and the current user
    const filtered = profiles.filter(
      (p) =>
        p.userId &&
        !p.userId.isBanned &&
        p.userId._id.toString() !== req.user._id.toString()
    );

    const total = await Profile.countDocuments(profileFilter);

    res.json({
      profiles: filtered,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (err) {
    console.error("Browse error:", err);
    res.status(500).json({ error: "Failed to fetch profiles." });
  }
};

// ─── Get single user's public profile ─────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password -passwordResetToken -passwordResetExpires");
    if (!user || user.isBanned) {
      return res.status(404).json({ error: "User not found." });
    }

    const profile = await Profile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    // Increment views (non-blocking)
    Profile.findByIdAndUpdate(profile._id, { $inc: { profileViews: 1 } }).exec();

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
};

// ─── Public Browse profiles ────────────────────────────────────────
exports.publicBrowseProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await Profile.find({})
      .populate("userId", "name avatar lastActive isBanned") // No email!
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const filtered = profiles.filter(
      (p) => p.userId && !p.userId.isBanned
    );

    const total = await Profile.countDocuments({});

    res.json({
      profiles: filtered,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (err) {
    console.error("Public Browse error:", err);
    res.status(500).json({ error: "Failed to fetch public profiles." });
  }
};

// ─── Get single user's public profile (unauthenticated) ─────────────
exports.getPublicUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Do NOT include email or other sensitive fields
    const user = await User.findById(id).select("name avatar lastActive isBanned createdAt");
    if (!user || user.isBanned) {
      return res.status(404).json({ error: "User not found." });
    }

    const profile = await Profile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    Profile.findByIdAndUpdate(profile._id, { $inc: { profileViews: 1 } }).exec();

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public profile." });
  }
};

// ─── Update own profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "age",
      "churchAndDenomination",
      "activelyServing",
      "favoriteBibleVerse",
      "datingForMarriage",
      "lifeCommitmentDate",
      "christianValues",
      "marriedBefore",
      "countryOfOriginAndEthnicity",
      "openToLongDistance",
      "pastorObjection",
      "videos",
      "audios",
      "gender",
      "dateOfBirth",
      "country",
      "city",
      "denomination",
      "churchAttendance",
      "maritalStatus",
      "relationshipGoal",
      "bio",
      "interests",
      "lookingFor",
      "ageRangeMin",
      "ageRangeMax",
      "height",
      "occupation",
      "education",
      "languages",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Also update name if provided
    if (req.body.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.name });
    }

    // Mark profile as complete if essential fields are filled
    const isComplete =
      profile.gender &&
      profile.dateOfBirth &&
      profile.country &&
      profile.denomination &&
      profile.bio;

    if (isComplete) {
      await User.findByIdAndUpdate(req.user._id, { profileComplete: true });
    }

    res.json({ profile, message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

// ─── Upload profile photo ──────────────────────────────────────────
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const profile = await Profile.findOne({ userId: req.user._id });

    const photo = {
      url: req.file.path,
      publicId: req.file.filename,
      isMain: profile.photos.length === 0, // First photo is main
    };

    profile.photos.push(photo);
    await profile.save();

    // Update user avatar to the new photo if it's the first
    if (photo.isMain) {
      await User.findByIdAndUpdate(req.user._id, { avatar: photo.url });
    }

    res.json({ photo, message: "Photo uploaded successfully." });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ error: "Failed to upload photo." });
  }
};

// ─── Delete profile photo ──────────────────────────────────────────
exports.deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const profile = await Profile.findOne({ userId: req.user._id });

    const photo = profile.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found." });
    }

    const wasMain = photo.isMain;
    await deleteFromCloudinary(photo.publicId);
    profile.photos.pull(photoId);

    // If deleted photo was main, set new main
    if (wasMain && profile.photos.length > 0) {
      profile.photos[0].isMain = true;
      await User.findByIdAndUpdate(req.user._id, {
        avatar: profile.photos[0].url,
      });
    } else if (profile.photos.length === 0) {
      await User.findByIdAndUpdate(req.user._id, { avatar: null });
    }

    await profile.save();
    res.json({ message: "Photo deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete photo." });
  }
};

// ─── Set main photo ────────────────────────────────────────────────
exports.setMainPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const profile = await Profile.findOne({ userId: req.user._id });

    profile.photos.forEach((p) => (p.isMain = p._id.toString() === photoId));
    await profile.save();

    const mainPhoto = profile.photos.find((p) => p.isMain);
    if (mainPhoto) {
      await User.findByIdAndUpdate(req.user._id, { avatar: mainPhoto.url });
    }

    res.json({ message: "Main photo updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to set main photo." });
  }
};
