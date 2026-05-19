import "dotenv/config";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "pos_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test the connection
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
};

testConnection();

export default db;