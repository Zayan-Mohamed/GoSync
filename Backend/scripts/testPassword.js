import bcrypt from "bcryptjs";

const inputPassword = "Faisal@123";
const storedHash = "$2b$10$pKiYUzHn8Mt4IaVqnQ71iu7yQ7oMMqnU2jllrY13bjPTWZ5SqUhkO"; // Use the stored hash from your DB

bcrypt.compare(inputPassword, storedHash, (err, result) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log(result ? "✅ Password matched" : "❌ Password mismatch");
  }
});
