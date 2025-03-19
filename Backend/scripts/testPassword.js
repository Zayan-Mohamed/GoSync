import bcrypt from "bcryptjs";

const inputPassword = "admin123";
const storedHash = "$2b$10$1GUyFhiWOsGfUETv6CdeKecaGYRjMfu15xhIqeZkUPrAjX/kjoa2G"; // Use the stored hash from your DB

bcrypt.compare(inputPassword, storedHash, (err, result) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log(result ? "✅ Password matched" : "❌ Password mismatch");
  }
});
