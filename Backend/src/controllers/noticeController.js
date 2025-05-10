import Notice from "../models/noticeModel.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Create a new notice
export const createNotice = async (req, res) => {
  try {
    const { title, content, category, importance, expiryDate, attachments } =
      req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Create a new notice ID
    const noticeId = `notice-${uuidv4().substring(0, 8)}`;

    const newNotice = new Notice({
      noticeId,
      title,
      content,
      category: category || "announcement",
      importance: importance || "medium",
      publishDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: true,
      createdBy: req.user.id, // Assuming req.user is set by auth middleware
      attachments: attachments || [],
    });

    await newNotice.save();

    res.status(201).json({
      success: true,
      data: newNotice,
    });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Get all notices with optional filtering
export const getAllNotices = async (req, res) => {
  try {
    const {
      category,
      importance,
      status,
      isActive,
      search,
      sort = "publishDate",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Apply filters if provided
    if (category) query.category = category;
    if (importance) query.importance = importance;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Handle status filter
    if (status === "active") {
      query.isActive = true;
      // Only active notices that are not expired
      if (query.expiryDate) {
        query.expiryDate = { $gt: new Date() };
      } else {
        query.$or = [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } },
        ];
      }
    } else if (status === "expired") {
      query.expiryDate = { $exists: true, $lt: new Date() };
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Search in title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const sortOption = {};
    sortOption[sort] = order === "desc" ? -1 : 1;

    // Execute query with pagination and sorting
    const notices = await Notice.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    // Count total documents for pagination
    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notices.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      data: notices,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Get notice by ID
export const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { skipViewIncrement } = req.query;

    // Try to find by noticeId first, then by MongoDB _id
    let notice = await Notice.findOne({ noticeId: id }).populate(
      "createdBy",
      "name email"
    );

    // If not found by noticeId, try to find by MongoDB _id
    if (!notice && mongoose.Types.ObjectId.isValid(id)) {
      notice = await Notice.findById(id).populate("createdBy", "name email");
    }

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: "Notice not found",
      });
    }

    // Only increment view count if skipViewIncrement is not set to true
    if (skipViewIncrement !== "true") {
      notice.viewCount += 1;
      await notice.save();
    }

    res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      category,
      importance,
      expiryDate,
      isActive,
      attachments,
    } = req.body;

    // Try to find by noticeId first, then by MongoDB _id
    let notice = await Notice.findOne({ noticeId: id });

    // If not found by noticeId, try to find by MongoDB _id
    if (!notice && mongoose.Types.ObjectId.isValid(id)) {
      notice = await Notice.findById(id);
    }

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: "Notice not found",
      });
    }

    // Check if the user is the creator of the notice
    if (notice.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Only the creator of this notice can update it",
      });
    }

    // Update fields if provided
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (category) notice.category = category;
    if (importance) notice.importance = importance;
    if (expiryDate) notice.expiryDate = new Date(expiryDate);
    if (isActive !== undefined) notice.isActive = isActive;
    if (attachments) notice.attachments = attachments;

    await notice.save();

    res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by noticeId first, then by MongoDB _id
    let notice = await Notice.findOne({ noticeId: id });

    // If not found by noticeId, try to find by MongoDB _id
    if (!notice && mongoose.Types.ObjectId.isValid(id)) {
      notice = await Notice.findById(id);
    }

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: "Notice not found",
      });
    }

    // Check if the user is the creator of the notice
    if (notice.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Only the creator of this notice can delete it",
      });
    }

    // Delete the notice
    await Notice.findByIdAndDelete(notice._id);

    res.status(200).json({
      success: true,
      message: "Notice successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Archive notices (bulk update isActive status)
export const archiveNotices = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No IDs provided for archiving",
      });
    }

    // Find all notices to verify ownership first
    const notices = await Notice.find({
      _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) },
    });

    // Filter to get only notices created by the current user
    const ownedNoticeIds = notices
      .filter((notice) => notice.createdBy.toString() === req.user.id)
      .map((notice) => notice._id);

    if (ownedNoticeIds.length === 0) {
      return res.status(403).json({
        success: false,
        error: "You can only archive notices that you created",
      });
    }

    // Only archive notices that the user owns
    const result = await Notice.updateMany(
      { _id: { $in: ownedNoticeIds } },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notices archived successfully`,
      notModified: ids.length - ownedNoticeIds.length,
    });
  } catch (error) {
    console.error("Error archiving notices:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Get notice stats for analytics
export const getNoticeStats = async (req, res) => {
  try {
    // Total count by category
    const categoryStats = await Notice.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total count by importance
    const importanceStats = await Notice.aggregate([
      { $group: { _id: "$importance", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total count by status
    const now = new Date();
    const statusCounts = {
      active: await Notice.countDocuments({
        isActive: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: now } },
        ],
      }),
      expired: await Notice.countDocuments({
        expiryDate: { $exists: true, $lt: now },
      }),
      inactive: await Notice.countDocuments({ isActive: false }),
    };

    // Most viewed notices
    const mostViewed = await Notice.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .select("title viewCount publishDate category");

    // Recent notices
    const recentNotices = await Notice.find()
      .sort({ publishDate: -1 })
      .limit(5)
      .select("title publishDate category importance");

    // Notices by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const noticesByMonth = await Notice.aggregate([
      {
        $match: {
          publishDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$publishDate" },
            month: { $month: "$publishDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: await Notice.countDocuments(),
        categoryStats,
        importanceStats,
        statusCounts,
        mostViewed,
        recentNotices,
        noticesByMonth,
      },
    });
  } catch (error) {
    console.error("Error getting notice stats:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

// Check edit permissions for a notice
export const checkEditPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by noticeId first, then by MongoDB _id
    let notice = await Notice.findOne({ noticeId: id });

    // If not found by noticeId, try to find by MongoDB _id
    if (!notice && mongoose.Types.ObjectId.isValid(id)) {
      notice = await Notice.findById(id);
    }

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: "Notice not found",
        hasEditAccess: false,
      });
    }

    // Check if the user is the creator of the notice (no longer include admin)
    const hasEditAccess = notice.createdBy.toString() === req.user.id;

    return res.status(200).json({
      success: true,
      hasEditAccess,
    });
  } catch (error) {
    console.error("Error checking notice permissions:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      hasEditAccess: false,
    });
  }
};
