// routes/stock.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET ALL PRODUCTS WITH STOCK INFO
router.get("/products", async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT id, name, category, stock_quantity, minimum_stock, selling_price, cost_price
      FROM products
      WHERE is_active = 1
      ORDER BY name ASC
    `);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET STOCK IN HISTORY
router.get("/history", async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const end = to || new Date().toISOString().split("T")[0];

    const [movements] = await db.query(`
      SELECT
        stock_movements.id,
        products.name AS productName,
        products.category,
        stock_movements.quantity,
        stock_movements.cost_price AS costPrice,
        (stock_movements.quantity * stock_movements.cost_price) AS totalCost,
        stock_movements.created_at
      FROM stock_movements
      JOIN products ON stock_movements.product_id = products.id
      WHERE stock_movements.type = 'IN'
      AND DATE(stock_movements.created_at) BETWEEN ? AND ?
      ORDER BY stock_movements.created_at DESC
    `, [start, end]);

    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock history." });
  }
});

// RECORD STOCK IN (existing product)
router.post("/in", async (req, res) => {
  const { productId, quantity, costPrice } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Product and quantity are required." });
  }
  if (costPrice === undefined || costPrice === null || costPrice < 0) {
    return res.status(400).json({ error: "Cost price is required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE products SET stock_quantity = stock_quantity + ?, cost_price = ? WHERE id = ?",
      [quantity, costPrice, productId]
    );
    await connection.query(
      "INSERT INTO stock_movements (product_id, type, quantity, cost_price) VALUES (?, 'IN', ?, ?)",
      [productId, quantity, costPrice]
    );
    await connection.commit();
    res.status(201).json({ message: "Stock recorded successfully." });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Failed to record stock." });
  } finally {
    connection.release();
  }
});

// CREATE NEW PRODUCT + RECORD STOCK IN
router.post("/new-product", async (req, res) => {
  const { name, category, sellingPrice, costPrice, quantity, minimumStock } = req.body;

  if (!name || !sellingPrice || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Name, selling price and quantity are required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT id FROM products WHERE name = ?", [name]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "A product with this name already exists." });
    }

    const [result] = await connection.query(
      `INSERT INTO products (name, category, selling_price, cost_price, stock_quantity, minimum_stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, category || null, sellingPrice, costPrice || 0, quantity, minimumStock || 5]
    );

    const productId = result.insertId;

    await connection.query(
      "INSERT INTO stock_movements (product_id, type, quantity, cost_price) VALUES (?, 'IN', ?, ?)",
      [productId, quantity, costPrice || 0]
    );

    await connection.commit();
    res.status(201).json({ message: "Product created and stock recorded successfully.", productId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Failed to create product." });
  } finally {
    connection.release();
  }
});

// ==========================================
// EDIT PRODUCT (name, category, selling price, cost price, min stock)
// ==========================================
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, sellingPrice, costPrice, minimumStock } = req.body;

  if (!name || !sellingPrice) {
    return res.status(400).json({ error: "Name and selling price are required." });
  }

  try {
    await db.query(
      `UPDATE products SET name = ?, category = ?, selling_price = ?, cost_price = ?, minimum_stock = ? WHERE id = ?`,
      [name, category || null, sellingPrice, costPrice || 0, minimumStock || 5, id]
    );
    res.json({ message: "Product updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product." });
  }
});

// ==========================================
// DEACTIVATE PRODUCT (soft delete — keeps history)
// ==========================================
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
    res.json({ message: "Product deactivated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate product." });
  }
});

export default router;