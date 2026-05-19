// routes/reports.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

const getDateRange = (from, to) => {
  const start = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const end = to || new Date().toISOString().split("T")[0];
  return { start, end };
};

router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;
    const { start, end } = getDateRange(from, to);

    // 1. SALES OVERVIEW
    const [overview] = await db.query(`
      SELECT
        SUM(total_amount) AS totalRevenue,
        COUNT(*) AS totalOrders,
        AVG(total_amount) AS avgOrder,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) AS todayRevenue,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS todayOrders
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [start, end]);

    // 2. PAYMENT METHODS
    const [paymentBreakdown] = await db.query(`
      SELECT payment_method AS method, COUNT(*) AS count, SUM(total_amount) AS total
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY payment_method
    `, [start, end]);

    // 3. TOP PRODUCTS BY QUANTITY (with profit)
    const [topByQuantity] = await db.query(`
      SELECT
        products.name, products.category, products.cost_price AS costPrice,
        SUM(sale_items.quantity) AS totalQuantity,
        SUM(sale_items.quantity * sale_items.price) AS totalRevenue,
        SUM(sale_items.quantity * products.cost_price) AS totalCost,
        SUM(sale_items.quantity * sale_items.price) - SUM(sale_items.quantity * products.cost_price) AS totalProfit
      FROM sale_items
      JOIN products ON sale_items.product_id = products.id
      JOIN sales ON sale_items.sale_id = sales.id
      WHERE DATE(sales.created_at) BETWEEN ? AND ?
      GROUP BY products.id, products.name, products.category, products.cost_price
      ORDER BY totalQuantity DESC
      LIMIT 10
    `, [start, end]);

    // 4. TOP PRODUCTS BY REVENUE (with profit)
    const [topByRevenue] = await db.query(`
      SELECT
        products.name, products.category, products.cost_price AS costPrice,
        SUM(sale_items.quantity) AS totalQuantity,
        SUM(sale_items.quantity * sale_items.price) AS totalRevenue,
        SUM(sale_items.quantity * products.cost_price) AS totalCost,
        SUM(sale_items.quantity * sale_items.price) - SUM(sale_items.quantity * products.cost_price) AS totalProfit
      FROM sale_items
      JOIN products ON sale_items.product_id = products.id
      JOIN sales ON sale_items.sale_id = sales.id
      WHERE DATE(sales.created_at) BETWEEN ? AND ?
      GROUP BY products.id, products.name, products.category, products.cost_price
      ORDER BY totalRevenue DESC
      LIMIT 10
    `, [start, end]);

    // 5. PROFIT SUMMARY
    const [profitSummary] = await db.query(`
      SELECT
        SUM(sale_items.quantity * sale_items.price) AS totalRevenue,
        SUM(sale_items.quantity * products.cost_price) AS totalCost,
        SUM(sale_items.quantity * sale_items.price) - SUM(sale_items.quantity * products.cost_price) AS grossProfit
      FROM sale_items
      JOIN products ON sale_items.product_id = products.id
      JOIN sales ON sale_items.sale_id = sales.id
      WHERE DATE(sales.created_at) BETWEEN ? AND ?
    `, [start, end]);

    // 6. CASHIER PERFORMANCE
    const [byCashier] = await db.query(`
      SELECT
        users.name AS cashier,
        COUNT(sales.id) AS totalOrders,
        SUM(sales.total_amount) AS totalRevenue,
        AVG(sales.total_amount) AS avgSale
      FROM sales
      JOIN users ON sales.user_id = users.id
      WHERE DATE(sales.created_at) BETWEEN ? AND ?
      GROUP BY users.id, users.name
      ORDER BY totalRevenue DESC
    `, [start, end]);

    // 7. DAILY TREND
    const [dailyTrend] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(total_amount) AS revenue
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [start, end]);

    // 8. HOURLY TREND
    const [hourlyTrend] = await db.query(`
      SELECT HOUR(created_at) AS hour, COUNT(*) AS orders, SUM(total_amount) AS revenue
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [start, end]);

    // 9. LOW STOCK
    const [lowStock] = await db.query(`
      SELECT name, category, stock_quantity, minimum_stock
      FROM products
      WHERE stock_quantity <= minimum_stock AND is_active = 1
      ORDER BY stock_quantity ASC
    `);

    // 10. STOCK MOVEMENTS
    const [stockMovements] = await db.query(`
      SELECT products.name, stock_movements.type, stock_movements.quantity, stock_movements.created_at
      FROM stock_movements
      JOIN products ON stock_movements.product_id = products.id
      WHERE DATE(stock_movements.created_at) BETWEEN ? AND ?
      ORDER BY stock_movements.created_at DESC
      LIMIT 30
    `, [start, end]);

    // 11. MONTHLY TREND
    const [monthlyTrend] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, SUM(total_amount) AS revenue
      FROM sales
      WHERE YEAR(created_at) = YEAR(?)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, [end]);

    res.json({
      dateRange: { start, end },
      overview: overview[0],
      profitSummary: profitSummary[0],
      paymentBreakdown,
      topByQuantity,
      topByRevenue,
      byCashier,
      dailyTrend,
      hourlyTrend,
      lowStock,
      stockMovements,
      monthlyTrend,
    });

  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Failed to load reports." });
  }
});

export default router;