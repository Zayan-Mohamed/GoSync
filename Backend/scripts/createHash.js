import bcrypt from "bcryptjs";

const inputPassword = "nopassword444";

bcrypt.hash(inputPassword, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
  } else {
    console.log("New Hash:", hash);
  }
});
