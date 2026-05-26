// routes/menu.js
import express from "express";
import db from "../config/db.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL MENU ITEMS
router.get("/", async (req, res) => {
  try {
    const [items] = await db.query(
      "SELECT id, name, price FROM menu_items ORDER BY name ASC"
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu items." });
  }
});

// ADD MENU ITEM
router.post("/", authorizeRoles("sudo_admin", "admin"), async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: "Name and price are required." });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO menu_items (name, price) VALUES (?, ?)",
      [name, price]
    );
    res.status(201).json({ message: "Menu item added.", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add menu item." });
  }
});

// EDIT MENU ITEM
router.put("/:id", authorizeRoles("sudo_admin", "admin"), async (req, res) => {
  const { name, price } = req.body;
  const { id } = req.params;
  if (!name || !price) {
    return res.status(400).json({ error: "Name and price are required." });
  }
  try {
    await db.query(
      "UPDATE menu_items SET name = ?, price = ? WHERE id = ?",
      [name, price, id]
    );
    res.json({ message: "Menu item updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item." });
  }
});

// DELETE MENU ITEM
router.delete("/:id", authorizeRoles("sudo_admin", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM menu_items WHERE id = ?", [id]);
    res.json({ message: "Menu item deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item." });
  }
});

export default router;
