// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";

// ==========================================
// 1. USER REGISTRATION (Sudo Admin only)
// ==========================================
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Only allow valid roles
  const validRoles = ["sudo_admin", "admin", "cashier"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Server error during registration." });
  }
});

// ==========================================
// 2. USER LOGIN
// ==========================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

export default router;
