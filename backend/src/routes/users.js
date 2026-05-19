// routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// CREATE USER
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const validRoles = ["sudo_admin", "admin", "cashier"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  if (req.user.role === "admin" && role !== "cashier") {
    return res.status(403).json({ error: "Admins can only create cashier accounts." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: "User created successfully.", userId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Failed to create user." });
  }
});

// UPDATE USER
router.put("/:id", async (req, res) => {
  const { name, email, password, role } = req.body;
  const { id } = req.params;

  if (req.user.role === "admin" && role !== "cashier") {
    return res.status(403).json({ error: "Admins can only edit cashier accounts." });
  }

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET name=?, email=?, password=?, role=? WHERE id=?",
        [name, email, hashedPassword, role, id]
      );
    } else {
      await db.query(
        "UPDATE users SET name=?, email=?, role=? WHERE id=?",
        [name, email, role, id]
      );
    }
    res.json({ message: "User updated successfully." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Failed to update user." });
  }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "sudo_admin") {
    return res.status(403).json({ error: "Only Sudo Admin can delete users." });
  }

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

export default router;