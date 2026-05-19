import express from "express";
import db from "../config/db.js";

const router = express.Router();

const productSelectQuery = `
  SELECT
    id,
    name,
    category,
    stock_quantity AS stock,
    selling_price AS price,
    minimum_stock AS minimumStock,
    created_at AS createdAt
  FROM products
  WHERE is_active = 1
`;

const validateProduct = ({ name, category, stock, price }) => {
  if (!name || !category || stock === undefined || price === undefined) {
    return "Name, category, stock, and price are required";
  }

  if (Number.isNaN(Number(stock)) || Number.isNaN(Number(price))) {
    return "Stock and price must be valid numbers";
  }

  return null;
};

router.get("/", async (req, res) => {
  try {
    const [products] = await db.query(`
      ${productSelectQuery}
      ORDER BY id ASC
    `);

    return res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

router.get("/:id", async (req, res) => {
  const productId = Number(req.params.id);

  try {
    const [products] = await db.query(
      `
      ${productSelectQuery}
      AND id = ?
      `,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json(products[0]);
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

router.post("/", async (req, res) => {
  const { name, category, stock, price } = req.body;
  const validationError = validateProduct(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const [result] = await db.query(
      `
      INSERT INTO products (name, category, stock_quantity, selling_price)
      VALUES (?, ?, ?, ?)
      `,
      [name, category, Number(stock), Number(price)]
    );

    return res.status(201).json({
      id: result.insertId,
      name,
      category,
      stock: Number(stock),
      price: Number(price),
    });
  } catch (error) {
    console.error("Failed to create product:", error);

    return res.status(500).json({
      message: "Failed to create product",
    });
  }
});

router.put("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  const { name, category, stock, price } = req.body;
  const validationError = validateProduct(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE products
      SET name = ?, category = ?, stock_quantity = ?, selling_price = ?
      WHERE id = ? AND is_active = 1
      `,
      [name, category, Number(stock), Number(price), productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      id: productId,
      name,
      category,
      stock: Number(stock),
      price: Number(price),
    });
  } catch (error) {
    console.error("Failed to update product:", error);

    return res.status(500).json({
      message: "Failed to update product",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const productId = Number(req.params.id);

  try {
    const [result] = await db.query(
      `
      UPDATE products
      SET is_active = 0
      WHERE id = ? AND is_active = 1
      `,
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);

    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
});

export default router;
