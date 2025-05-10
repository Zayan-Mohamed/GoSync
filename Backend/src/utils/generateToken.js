import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      isAdmin: user.isAdmin,
      role: user.role
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: "30d", // Token expires in 30 days
    }
  );
};

export { generateToken };