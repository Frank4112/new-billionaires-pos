// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";

// 1. Verify if the user is logged in
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
};

// 2. Restrict access based on role
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: You do not have permission." });
    }
    next();
  };
};
