import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const createUploadDirs = () => {
  const uploadDir = path.join(process.cwd(), "uploads");
  const profileImagesDir = path.join(uploadDir, "profile-images");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir);
  }
};

// Create directories on startup
createUploadDirs();

// Configure storage for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "profile-images"));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp.extension
    const userId = req.user?._id || "user";
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname).toLowerCase();

    console.log("File upload info:", {
      userId: req.user?._id,
      originalName: file.originalname,
      generatingFilename: `${userId}-${timestamp}${fileExt}`,
    });

    cb(null, `${userId}-${timestamp}${fileExt}`);
  },
});

// Filter function to accept only image files
const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, JPEG, PNG, GIF) are allowed"));
  }
};

// Configure multer for profile image uploads
export const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export default {
  profileImageUpload,
};
