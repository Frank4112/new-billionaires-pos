import express from "express";
import db from "../config/db.js";

const router = express.Router();

const validPaymentMethods = ["cash", "mpesa"];

/* =========================
   GET ALL SALES
========================= */

router.get("/", async (req, res) => {
  try {
    const { userId, from, to } = req.query;

    let query = `
      SELECT
        sales.id,
        sales.total_amount AS totalAmount,
        sales.payment_method AS paymentMethod,
        sales.created_at AS createdAt,
        users.name AS cashierName
      FROM sales
      LEFT JOIN users ON sales.user_id = users.id
    `;

    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push("sales.user_id = ?");
      params.push(Number(userId));
    }

    if (from) {
      conditions.push("DATE(sales.created_at) >= ?");
      params.push(from);
    }

    if (to) {
      conditions.push("DATE(sales.created_at) <= ?");
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY sales.created_at DESC";

    const [sales] = await db.query(query, params);
    return res.json(sales);

  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return res.status(500).json({ message: "Failed to fetch sales" });
  }
});
/* =========================
   GET SINGLE SALE
========================= */

router.get("/:id", async (req, res) => {

  const saleId = Number(req.params.id);

  try {

    const [saleItems] = await db.query(`
      SELECT
        sale_items.id,
        sale_items.item_type AS type,
        COALESCE(products.name, menu_items.name) AS name,
        sale_items.quantity,
        sale_items.price
      FROM sale_items
      LEFT JOIN products
        ON sale_items.product_id = products.id
      LEFT JOIN menu_items
        ON sale_items.menu_item_id = menu_items.id
      WHERE sale_items.sale_id = ?
    `, [saleId]);

    return res.json(saleItems);

  } catch (error) {

    console.error("Failed to fetch sale details:", error);

    return res.status(500).json({
      message: "Failed to fetch sale details",
    });
  }
});

/* =========================
   CREATE SALE
========================= */

router.post("/", async (req, res) => {
  const { items, paymentMethod, userId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart items are required" });
  }

  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: "Payment method must be cash or mpesa" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const itemType = item.type || "bar";

      if (!productId || !quantity || quantity < 1) {
        throw new Error("Each cart item must include a valid product and quantity");
      }

      if (!["bar", "food"].includes(itemType)) {
        throw new Error("Cart item type must be bar or food");
      }

      if (itemType === "food") {
        // Look up in menu_items — no stock to check
        const [menuItems] = await connection.query(
          "SELECT id, name, price FROM menu_items WHERE id = ?",
          [productId]
        );

        if (menuItems.length === 0) {
          const error = new Error("Menu item not found");
          error.statusCode = 404;
          throw error;
        }

        const menuItem = menuItems[0];
        const price = Number(menuItem.price);
        totalAmount += price * quantity;

        saleItems.push({ menuItemId: productId, quantity, price, type: "food" });

      } else {
        // Look up in products — check stock
        const [products] = await connection.query(`
          SELECT id, name, stock_quantity, selling_price
          FROM products
          WHERE id = ? AND is_active = 1
          FOR UPDATE
        `, [productId]);

        if (products.length === 0) {
          const error = new Error("Product not found");
          error.statusCode = 404;
          throw error;
        }

        const product = products[0];

        if (Number(product.stock_quantity) < quantity) {
          const error = new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock_quantity}`
          );
          error.statusCode = 400;
          throw error;
        }

        const price = Number(product.selling_price);
        totalAmount += price * quantity;
        saleItems.push({ productId, quantity, price, type: "bar" });
      }
    }

    // Insert sale
    const [saleResult] = await connection.query(
      "INSERT INTO sales (total_amount, payment_method, user_id) VALUES (?, ?, ?)",
      [totalAmount, paymentMethod, userId || null]
    );

    const saleId = saleResult.insertId;

    for (const item of saleItems) {
      await connection.query(
        `
        INSERT INTO sale_items (sale_id, item_type, product_id, menu_item_id, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          saleId,
          item.type,
          item.type === "bar" ? item.productId : null,
          item.type === "food" ? item.menuItemId : null,
          item.quantity,
          item.price,
        ]
      );

      if (item.type === "bar") {
        await connection.query(
          "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
          [item.quantity, item.productId]
        );

        await connection.query(
          "INSERT INTO stock_movements (product_id, type, quantity, reference_id) VALUES (?, 'OUT', ?, ?)",
          [item.productId, item.quantity, saleId]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: "Sale completed successfully",
      saleId,
      totalAmount,
      paymentMethod,
    });

  } catch (error) {
    await connection.rollback();
    console.error("Failed to complete sale:", error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Failed to complete sale",
    });
  } finally {
    connection.release();
  }
});

export default router;
