import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/products.js";
import saleRoutes from "./routes/sales.js";
import userRoutes from "./routes/users.js";
import reportRoutes from "./routes/reports.js";
import stockRoutes from "./routes/stock.js";
import authRoutes from "./routes/auth.js"; // 1. Import your auth routes
import { verifyToken, authorizeRoles } from "./middleware/authMiddleware.js"; // 2. Import middleware

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "New Billionaires POS API is running",
  });
});

// 3. Publicly accessible authentication endpoints (Login / Register)
app.use("/api/auth", authRoutes);

// 4. Guard your existing application routes
// BOTH admins and cashiers can fetch products or process checkouts
app.use("/api/products", verifyToken, productRoutes);
app.use("/api/sales", verifyToken, saleRoutes);
app.use("/api/reports", verifyToken, authorizeRoles("sudo_admin", "admin"), reportRoutes);
app.use("/api/stock", verifyToken, authorizeRoles("sudo_admin", "admin"), stockRoutes);
app.use("/api/users", verifyToken, authorizeRoles("sudo_admin", "admin"), userRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});