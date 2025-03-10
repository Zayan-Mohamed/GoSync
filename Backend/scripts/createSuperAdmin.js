import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../src/models/user.js";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createSuperAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("❌ Super Admin already exists. No action taken.");
      const storedHash = "$2b$10$ovVojyeUPjrO0pAxgB3W9efZ6cnXmzeYYxFUVorQ8TWVsvpjpkmGC"; // Get this from your DB
      const inputPassword = "nopassword444";
    
      bcrypt.compare(inputPassword, storedHash, (err, isMatch) => {
        console.log(isMatch ? "✅ Password is correct!" : "❌ Incorrect password.");
        console.log("🔐 Encrypted input password:", bcrypt.hashSync(inputPassword, 10));
      });
      return;
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash("SuperAdmin123", 10);
    console.log("🔐 Super Admin password:", hashedPassword);
    const admin = await User.create({
      name: "Super Admin",
      email: "superadmin@example.com",
      phone: 9876543210,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Super Admin created successfully!");
  } catch (error) {
    console.error("⚠️ Error creating super admin:", error);
  } finally {
    mongoose.connection.close();
  }

};

createSuperAdmin();
