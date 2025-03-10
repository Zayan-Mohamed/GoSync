import bcrypt from "bcryptjs";

const inputPassword = "nopassword444";
const storedHash = "$2b$10$v3cS9XCBe8.48UXITie9Y.Elik0EoKqz5FLGZve6iMeeIQ6RLVoRO"; // Use the stored hash from your DB

bcrypt.compare(inputPassword, storedHash, (err, result) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log(result ? "✅ Password matched" : "❌ Password mismatch");
  }
});
