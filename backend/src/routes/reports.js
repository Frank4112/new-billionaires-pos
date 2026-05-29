// routes/reports.js

import express from "express";
import db from "../config/db.js";

const router = express.Router();

const getDateRange = (from, to) => {
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

  return { start, end };
};

router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;
    const { start, end } = getDateRange(from, to);

    // ======================================================
    // 1. SALES OVERVIEW
    // ======================================================

    const [overview] = await db.query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS totalRevenue,
        COUNT(*) AS totalOrders,
        COALESCE(AVG(total_amount), 0) AS avgOrder,

        COALESCE(
          SUM(
            CASE
              WHEN DATE(created_at) = CURDATE()
              THEN total_amount
              ELSE 0
            END
          ),
          0
        ) AS todayRevenue,

        COUNT(
          CASE
            WHEN DATE(created_at) = CURDATE()
            THEN 1
          END
        ) AS todayOrders

      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      `,
      [start, end]
    );

    // ======================================================
    // 2. PAYMENT METHODS
    // ======================================================

    const [paymentBreakdown] = await db.query(
      `
      SELECT
        payment_method AS method,
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS total

      FROM sales

      WHERE DATE(created_at) BETWEEN ? AND ?

      GROUP BY payment_method
      `,
      [start, end]
    );

    // ======================================================
    // 3. TOP BAR PRODUCTS BY QUANTITY
    // ======================================================

    const [topByQuantity] = await db.query(
      `
      SELECT
        p.name,
        p.category,
        p.cost_price AS costPrice,

        SUM(si.quantity) AS totalQuantity,

        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue,

        COALESCE(
          SUM(si.quantity * p.cost_price),
          0
        ) AS totalCost,

        COALESCE(
          SUM(si.quantity * si.price) -
          SUM(si.quantity * p.cost_price),
          0
        ) AS totalProfit

      FROM sale_items si

      INNER JOIN products p
        ON si.product_id = p.id

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE si.item_type = 'bar'
      AND DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY
        p.id,
        p.name,
        p.category,
        p.cost_price

      ORDER BY totalQuantity DESC

      LIMIT 10
      `,
      [start, end]
    );

    // ======================================================
    // 4. TOP BAR PRODUCTS BY REVENUE
    // ======================================================

    const [topByRevenue] = await db.query(
      `
      SELECT
        p.name,
        p.category,
        p.cost_price AS costPrice,

        SUM(si.quantity) AS totalQuantity,

        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue,

        COALESCE(
          SUM(si.quantity * p.cost_price),
          0
        ) AS totalCost,

        COALESCE(
          SUM(si.quantity * si.price) -
          SUM(si.quantity * p.cost_price),
          0
        ) AS totalProfit

      FROM sale_items si

      INNER JOIN products p
        ON si.product_id = p.id

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE si.item_type = 'bar'
      AND DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY
        p.id,
        p.name,
        p.category,
        p.cost_price

      ORDER BY totalRevenue DESC

      LIMIT 10
      `,
      [start, end]
    );

    // ======================================================
    // 5. TOP FOOD ITEMS BY QUANTITY
    // ======================================================

    const [foodByQuantity] = await db.query(
      `
      SELECT
        mi.name,
        'Food' AS category,

        SUM(si.quantity) AS totalQuantity,

        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue

      FROM sale_items si

      INNER JOIN menu_items mi
        ON si.menu_item_id = mi.id

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE si.item_type = 'food'
      AND DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY
        mi.id,
        mi.name

      ORDER BY totalQuantity DESC

      LIMIT 10
      `,
      [start, end]
    );

    // ======================================================
    // 6. TOP FOOD ITEMS BY REVENUE
    // ======================================================

    const [foodByRevenue] = await db.query(
      `
      SELECT
        mi.name,
        'Food' AS category,

        SUM(si.quantity) AS totalQuantity,

        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue

      FROM sale_items si

      INNER JOIN menu_items mi
        ON si.menu_item_id = mi.id

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE si.item_type = 'food'
      AND DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY
        mi.id,
        mi.name

      ORDER BY totalRevenue DESC

      LIMIT 10
      `,
      [start, end]
    );

    // ======================================================
    // 7. BAR VS FOOD PERFORMANCE
    // ======================================================

    const [itemTypeBreakdown] = await db.query(
      `
      SELECT
        si.item_type AS type,

        SUM(si.quantity) AS totalQuantity,

        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue,

        COUNT(DISTINCT si.sale_id) AS totalOrders

      FROM sale_items si

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY si.item_type

      ORDER BY totalRevenue DESC
      `,
      [start, end]
    );

    // ======================================================
    // 8. PROFIT SUMMARY (BAR ONLY)
    // ======================================================

    const [profitSummary] = await db.query(
      `
      SELECT
        COALESCE(
          SUM(si.quantity * si.price),
          0
        ) AS totalRevenue,

        COALESCE(
          SUM(si.quantity * p.cost_price),
          0
        ) AS totalCost,

        COALESCE(
          SUM(si.quantity * si.price) -
          SUM(si.quantity * p.cost_price),
          0
        ) AS grossProfit

      FROM sale_items si

      INNER JOIN products p
        ON si.product_id = p.id

      INNER JOIN sales s
        ON si.sale_id = s.id

      WHERE si.item_type = 'bar'
      AND DATE(s.created_at) BETWEEN ? AND ?
      `,
      [start, end]
    );

    // ======================================================
    // 9. CASHIER PERFORMANCE
    // ======================================================

    const [byCashier] = await db.query(
      `
      SELECT
        u.name AS cashier,

        COUNT(s.id) AS totalOrders,

        COALESCE(
          SUM(s.total_amount),
          0
        ) AS totalRevenue,

        COALESCE(
          AVG(s.total_amount),
          0
        ) AS avgSale

      FROM sales s

      INNER JOIN users u
        ON s.user_id = u.id

      WHERE DATE(s.created_at) BETWEEN ? AND ?

      GROUP BY
        u.id,
        u.name

      ORDER BY totalRevenue DESC
      `,
      [start, end]
    );

    // ======================================================
    // 10. DAILY TREND
    // ======================================================

    const [dailyTrend] = await db.query(
      `
      SELECT
        DATE(created_at) AS date,

        COUNT(*) AS orders,

        COALESCE(
          SUM(total_amount),
          0
        ) AS revenue

      FROM sales

      WHERE DATE(created_at) BETWEEN ? AND ?

      GROUP BY DATE(created_at)

      ORDER BY date ASC
      `,
      [start, end]
    );

    // ======================================================
    // 11. HOURLY TREND
    // ======================================================

    const [hourlyTrend] = await db.query(
      `
      SELECT
        HOUR(created_at) AS hour,

        COUNT(*) AS orders,

        COALESCE(
          SUM(total_amount),
          0
        ) AS revenue

      FROM sales

      WHERE DATE(created_at) BETWEEN ? AND ?

      GROUP BY HOUR(created_at)

      ORDER BY hour ASC
      `,
      [start, end]
    );

    // ======================================================
    // 12. LOW STOCK
    // ======================================================

    const [lowStock] = await db.query(
      `
      SELECT
        name,
        category,
        stock_quantity,
        minimum_stock

      FROM products

      WHERE stock_quantity <= minimum_stock
      AND is_active = 1

      ORDER BY stock_quantity ASC
      `
    );

    // ======================================================
    // 13. STOCK MOVEMENTS
    // ======================================================

    const [stockMovements] = await db.query(
      `
      SELECT
        p.name,
        sm.type,
        sm.quantity,
        sm.created_at

      FROM stock_movements sm

      INNER JOIN products p
        ON sm.product_id = p.id

      WHERE DATE(sm.created_at) BETWEEN ? AND ?

      ORDER BY sm.created_at DESC

      LIMIT 30
      `,
      [start, end]
    );

    // ======================================================
    // 14. MONTHLY TREND
    // ======================================================

    const [monthlyTrend] = await db.query(
      `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,

        COUNT(*) AS orders,

        COALESCE(
          SUM(total_amount),
          0
        ) AS revenue

      FROM sales

      WHERE YEAR(created_at) = YEAR(?)

      GROUP BY DATE_FORMAT(created_at, '%Y-%m')

      ORDER BY month ASC
      `,
      [end]
    );

    // ======================================================
    // RESPONSE
    // ======================================================

    res.json({
      dateRange: {
        start,
        end,
      },

      overview: overview[0],

      paymentBreakdown,

      topByQuantity,
      topByRevenue,

      foodByQuantity,
      foodByRevenue,

      itemTypeBreakdown,

      profitSummary: profitSummary[0],

      byCashier,

      dailyTrend,
      hourlyTrend,
      monthlyTrend,

      lowStock,

      stockMovements,
    });

  } catch (err) {
    console.error("Reports error:", err);

    res.status(500).json({
      error: "Failed to load reports.",
    });
  }
});

export default router;