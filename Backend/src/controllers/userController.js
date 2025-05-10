import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validate input fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate phone in E.164 format (e.g., +12025550123)
  if (!/^\+\d{10,15}$/.test(phone)) {
    return res
      .status(400)
      .json({
        message: "Phone number must be in E.164 format (e.g., +12025550123)",
      });
  }

  // Check if user already exists by email or phone
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    return res
      .status(400)
      .json({ message: "Email or phone number already in use" });
  }

  console.log("Password before hashing:", password);
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password before storing:", hashedPassword);

  // Always assign "passenger" role unless created by an admin
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "passenger",
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Generate token with phone included
  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  // If a profile picture URL exists, read the file and convert to Base64
  let profilePictureData = null;
  if (
    user.profilePicture &&
    user.profilePicture.includes("/uploads/profile-images/")
  ) {
    try {
      const filename = user.profilePicture.split("/").pop();
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "uploads",
        "profile-images",
        filename
      );
      console.log(`Looking for profile image at: ${imagePath}`);

      try {
        await fs.access(imagePath);
        const imageBuffer = await fs.readFile(imagePath);
        const ext = path.extname(filename).toLowerCase();
        let mimeType = "image/jpeg";
        if (ext === ".png") mimeType = "image/png";
        if (ext === ".gif") mimeType = "image/gif";
        profilePictureData = `data:${mimeType};base64,${imageBuffer.toString(
          "base64"
        )}`;
        console.log(
          "Successfully loaded profile picture data for login response"
        );
      } catch (err) {
        console.error("Profile image file not found:", imagePath);
        user.profilePicture = "";
        await user.save();
      }
    } catch (err) {
      console.error("Error reading profile image:", err);
    }
  }

  // Store token in a secure HTTP-only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profilePicture: user.profilePicture,
    profilePictureData: profilePictureData,
    address: user.address,
    notificationPreferences: user.notificationPreferences,
    token: token,
  });
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log("User found:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate current password if new password is provided
    if (req.body.password && req.body.currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    } else if (req.body.password) {
      return res
        .status(400)
        .json({
          message: "Current password is required to set a new password",
        });
    }

    // Validate phone if provided
    if (req.body.phone && !/^\+\d{10,15}$/.test(req.body.phone)) {
      return res
        .status(400)
        .json({
          message: "Phone number must be in E.164 format (e.g., +12025550123)",
        });
    }

    // Update user data
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (req.body.address) {
      user.address = req.body.address;
    }

    if (req.body.notificationPreferences !== undefined) {
      user.notificationPreferences = req.body.notificationPreferences;
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
      user.securityLog = user.securityLog || [];
      user.securityLog.push({
        action: "password_change",
        timestamp: new Date(),
        ipAddress: req.ip,
      });
    }

    console.log("User data before saving:", user);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.securityLog;

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -securityLog"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.securityLog = user.securityLog || [];
    user.securityLog.push({
      action: "password_change",
      timestamp: new Date(),
      ipAddress: req.ip,
    });

    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const {
      email: emailNotifications,
      sms: smsNotifications,
      push: pushNotifications,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationPreferences = {
      email:
        emailNotifications !== undefined
          ? emailNotifications
          : user.notificationPreferences?.email,
      sms:
        smsNotifications !== undefined
          ? smsNotifications
          : user.notificationPreferences?.sms,
      push:
        pushNotifications !== undefined
          ? pushNotifications
          : user.notificationPreferences?.push,
    };

    await user.save();
    res.json({
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({
        message: "Error updating notification preferences",
        error: error.message,
      });
  }
};

export const getSecurityLog = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("securityLog");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ securityLog: user.securityLog || [] });
  } catch (error) {
    console.error("Error fetching security log:", error);
    res
      .status(500)
      .json({ message: "Error fetching security log", error: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    console.log("Profile image upload started");
    console.log("Request file:", req.file);

    if (!req.file) {
      console.error("No file found in request");
      return res.status(400).json({ message: "No image file provided" });
    }

    console.log("File details:", {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`User not found: ${req.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    const fs = await import("fs/promises");
    const imageBuffer = await fs.readFile(req.file.path);
    const base64Image = `data:${
      req.file.mimetype
    };base64,${imageBuffer.toString("base64")}`;

    const port = process.env.PORT || 5000;
    const baseUrl = `http://localhost:${port}`;
    const relativePath = `/uploads/profile-images/${req.file.filename}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    console.log(`Generated image URL: ${imageUrl}`);

    const previousProfilePicture = user.profilePicture;
    user.profilePicture = imageUrl;

    user.securityLog = user.securityLog || [];
    user.securityLog.push({
      action: "profile_picture_update",
      timestamp: new Date(),
      ipAddress: req.ip,
    });

    await user.save();
    console.log(
      `User profile updated. Previous picture: ${previousProfilePicture}, New picture: ${imageUrl}`
    );

    const verifiedUser = await User.findById(req.user.id);
    if (verifiedUser.profilePicture !== imageUrl) {
      console.error("Profile picture update verification failed!");
      console.error(
        `Expected: ${imageUrl}, Got: ${verifiedUser.profilePicture}`
      );
    } else {
      console.log("Profile picture update verified successfully");
    }

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: imageUrl,
      profilePictureData: base64Image,
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res
      .status(500)
      .json({ message: "Error uploading profile image", error: error.message });
  }
};

export const getProfileImageBase64 = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profilePicture) {
      return res.status(404).json({ message: "No profile image found" });
    }

    const filename = user.profilePicture.split("/").pop();
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "uploads",
      "profile-images",
      filename
    );
    console.log(`Looking for profile image at: ${imagePath}`);

    try {
      await fs.access(imagePath);
      const imageBuffer = await fs.readFile(imagePath);
      const ext = path.extname(filename).toLowerCase();
      let mimeType = "image/jpeg";
      if (ext === ".png") mimeType = "image/png";
      if (ext === ".gif") mimeType = "image/gif";
      const base64Image = `data:${mimeType};base64,${imageBuffer.toString(
        "base64"
      )}`;
      console.log("Successfully loaded profile image as Base64");

      res.json({ profilePictureData: base64Image });
    } catch (err) {
      console.error("Profile image file not found:", imagePath);
      res.status(404).json({ message: "Image file not found" });
    }
  } catch (error) {
    console.error("Error getting profile image:", error);
    res
      .status(500)
      .json({ message: "Error getting profile image", error: error.message });
  }
};
