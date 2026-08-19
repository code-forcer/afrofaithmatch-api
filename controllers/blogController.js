const Blog = require("../models/Blog");
const { deleteFromCloudinary } = require("../middleware/upload");

// ─── Get all published posts ───────────────────────────────────────
exports.getPosts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;

    const filter = { published: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { excerpt: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Blog.countDocuments(filter);

    const posts = await Blog.find(filter)
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content"); // Don't send full content on list

    res.json({
      posts,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog posts." });
  }
};

// ─── Get single post by slug ───────────────────────────────────────
exports.getPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Blog.findOne({ slug, published: true }).populate("author", "name avatar");
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Increment views
    await Blog.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post." });
  }
};

// ─── Create post (admin) ───────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, published } = req.body;

    const postData = {
      title,
      excerpt,
      content,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
      published: published === "true" || published === true,
      author: req.user._id,
    };

    if (req.file) {
      postData.coverImage = req.file.path;
      postData.coverImagePublicId = req.file.filename;
    }

    const post = await Blog.create(postData);
    await post.populate("author", "name avatar");

    res.status(201).json({ post, message: "Blog post created." });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post." });
  }
};

// ─── Update post (admin) ───────────────────────────────────────────
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Blog.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    const allowedFields = ["title", "excerpt", "content", "category", "tags", "published"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.tags && !Array.isArray(req.body.tags)) {
      updates.tags = req.body.tags.split(",").map((t) => t.trim());
    }
    updates.published = req.body.published === "true" || req.body.published === true;

    if (req.file) {
      // Delete old image
      if (post.coverImagePublicId) await deleteFromCloudinary(post.coverImagePublicId);
      updates.coverImage = req.file.path;
      updates.coverImagePublicId = req.file.filename;
    }

    const updated = await Blog.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
      .populate("author", "name avatar");

    res.json({ post: updated, message: "Post updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update post." });
  }
};

// ─── Delete post (admin) ───────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Blog.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    if (post.coverImagePublicId) await deleteFromCloudinary(post.coverImagePublicId);
    await Blog.findByIdAndDelete(id);

    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post." });
  }
};
