import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    noticeId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "announcement",
        "service_change",
        "maintenance",
        "emergency",
        "other",
      ],
      default: "announcement",
    },
    importance: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add a method to check if notice is expired
noticeSchema.methods.isExpired = function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Add a virtual property for notice status
noticeSchema.virtual("status").get(function () {
  if (!this.isActive) return "inactive";
  if (this.expiryDate && new Date() > this.expiryDate) return "expired";
  return "active";
});

export default mongoose.model("Notice", noticeSchema);
