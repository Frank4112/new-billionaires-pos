import express from "express";
import db from "../config/db.js";

const router = express.Router();


// =====================================================
// GET ALL INGREDIENTS
// =====================================================
router.get("/ingredients", async (req, res) => {
  try {
    const [ingredients] = await db.query(`
      SELECT *
      FROM ingredients
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    res.json(ingredients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ingredients." });
  }
});


// =====================================================
// GET MOVEMENT HISTORY
// =====================================================
router.get("/history", async (req, res) => {
  try {
    const { from, to } = req.query;

    const start =
      from ||
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

    const end =
      to || new Date().toISOString().split("T")[0];

    const [history] = await db.query(
      `
      SELECT
        im.id,
        i.name AS ingredientName,
        im.movement_type,
        im.quantity,
        im.unit,
        im.cost_per_unit,
        im.total_cost,
        im.notes,
        im.created_at
      FROM ingredient_movements im
      JOIN ingredients i
        ON im.ingredient_id = i.id
      WHERE DATE(im.created_at)
        BETWEEN ? AND ?
      ORDER BY im.created_at DESC
      `,
      [start, end]
    );

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});


// =====================================================
// CREATE INGREDIENT
// =====================================================
router.post("/ingredients", async (req, res) => {
  const {
    name,
    defaultUnit,
    minimumQuantity,
    notes,
  } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Ingredient name is required.",
    });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM ingredients WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Ingredient already exists.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO ingredients
      (
        name,
        default_unit,
        minimum_quantity,
        notes
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        name,
        defaultUnit || "kg",
        minimumQuantity || 0,
        notes || null,
      ]
    );

    res.status(201).json({
      message: "Ingredient created successfully.",
      ingredientId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to create ingredient.",
    });
  }
});


// =====================================================
// STOCK IN
// =====================================================
router.post("/stock-in", async (req, res) => {
  const {
    ingredientId,
    quantity,
    costPerUnit,
    notes,
  } = req.body;

  if (!ingredientId || !quantity) {
    return res.status(400).json({
      error: "Ingredient and quantity are required.",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[ingredient]] = await connection.query(
      `
      SELECT *
      FROM ingredients
      WHERE id = ?
      `,
      [ingredientId]
    );

    if (!ingredient) {
      throw new Error("Ingredient not found.");
    }

    const totalCost =
      Number(quantity) *
      Number(costPerUnit || 0);

    await connection.query(
      `
      UPDATE ingredients
      SET current_quantity =
          current_quantity + ?
      WHERE id = ?
      `,
      [quantity, ingredientId]
    );

    await connection.query(
      `
      INSERT INTO ingredient_movements
      (
        ingredient_id,
        movement_type,
        quantity,
        unit,
        cost_per_unit,
        total_cost,
        notes
      )
      VALUES
      (?, 'IN', ?, ?, ?, ?, ?)
      `,
      [
        ingredientId,
        quantity,
        ingredient.default_unit,
        costPerUnit || 0,
        totalCost,
        notes || null,
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Stock added successfully.",
    });
  } catch (err) {
    await connection.rollback();

    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  } finally {
    connection.release();
  }
});


// =====================================================
// STOCK OUT
// =====================================================
router.post("/stock-out", async (req, res) => {
  const {
    ingredientId,
    quantity,
    notes,
  } = req.body;

  if (!ingredientId || !quantity) {
    return res.status(400).json({
      error: "Ingredient and quantity are required.",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[ingredient]] = await connection.query(
      `
      SELECT *
      FROM ingredients
      WHERE id = ?
      `,
      [ingredientId]
    );

    if (!ingredient) {
      throw new Error("Ingredient not found.");
    }

    if (
      Number(quantity) >
      Number(ingredient.current_quantity)
    ) {
      throw new Error(
        "Cannot issue more than available stock."
      );
    }

    await connection.query(
      `
      UPDATE ingredients
      SET current_quantity =
          current_quantity - ?
      WHERE id = ?
      `,
      [quantity, ingredientId]
    );

    await connection.query(
      `
      INSERT INTO ingredient_movements
      (
        ingredient_id,
        movement_type,
        quantity,
        unit,
        notes
      )
      VALUES
      (?, 'OUT', ?, ?, ?)
      `,
      [
        ingredientId,
        quantity,
        ingredient.default_unit,
        notes || null,
      ]
    );

    await connection.commit();

    res.json({
      message: "Stock issued successfully.",
    });
  } catch (err) {
    await connection.rollback();

    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  } finally {
    connection.release();
  }
});


// =====================================================
// UPDATE INGREDIENT
// =====================================================
router.put("/ingredients/:id", async (req, res) => {
  const { id } = req.params;

  const {
    name,
    defaultUnit,
    minimumQuantity,
    notes,
  } = req.body;

  try {
    await db.query(
      `
      UPDATE ingredients
      SET
        name = ?,
        default_unit = ?,
        minimum_quantity = ?,
        notes = ?
      WHERE id = ?
      `,
      [
        name,
        defaultUnit,
        minimumQuantity || 0,
        notes || null,
        id,
      ]
    );

    res.json({
      message: "Ingredient updated successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update ingredient.",
    });
  }
});


// =====================================================
// DEACTIVATE INGREDIENT
// =====================================================
router.delete("/ingredients/:id", async (req, res) => {
  try {
    await db.query(
      `
      UPDATE ingredients
      SET is_active = 0
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({
      message: "Ingredient deactivated successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to deactivate ingredient.",
    });
  }
});

export default router;