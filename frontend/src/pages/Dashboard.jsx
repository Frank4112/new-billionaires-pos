import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCashRegister, FaBox, FaChartBar, FaReceipt, FaHistory } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const REPORTS_URL = `${API_BASE_URL}/reports`;
const SALES_URL = `${API_BASE_URL}/sales`;

const getHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (v) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatNum = (v) => Number(v || 0).toLocaleString();

function StatCard({ title, value, sub, icon, accent = "#c9a84c", onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1a1a2e" : "#ffffff",
        border: `1px solid ${hovered ? "#1a1a2e" : "#e0ddd5"}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: "12px",
        padding: "20px 22px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: "180px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: hovered ? "#9ca3af" : "#6b6b6b", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: "600" }}>
            {title}
          </p>
          <p style={{ color: hovered ? "#ffffff" : "#1a1a2e", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>
            {value}
          </p>
          {sub && <p style={{ color: hovered ? "#6b7280" : "#9ca3af", fontSize: "12px", margin: 0 }}>{sub}</p>}
        </div>
        <div style={{ color: accent, fontSize: "22px", opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon, onClick, color = "#1a1a2e" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "14px 20px",
        background: hovered ? color : "#ffffff",
        color: hovered ? "#c9a84c" : color,
        border: `1px solid ${color}`,
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <span style={{ fontSize: "16px" }}>{icon}</span>
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [reports, setReports] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

    Promise.all([
      fetch(`${REPORTS_URL}?from=${monthStart}&to=${today}`, { headers: getHeaders() }).then((r) => r.json()),
      fetch(SALES_URL, { headers: getHeaders() }).then((r) => r.json()),
    ])
      .then(([reportData, salesData]) => {
        setReports(reportData);
        setRecentSales(Array.isArray(salesData) ? salesData.slice(0, 5) : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "#888" }}>Loading dashboard...</div>;

  const overview = reports?.overview || {};
  const topProducts = reports?.topByQuantity?.slice(0, 5) || [];

  return (
    <div className="page-shell dashboard-page" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "700", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <StatCard
          title="Today's Revenue"
          value={formatMoney(overview.todayRevenue)}
          sub={`${overview.todayOrders || 0} orders today`}
          icon={<FaCashRegister />}
          accent="#c9a84c"
          onClick={() => navigate("/sales-history")}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatMoney(overview.totalRevenue)}
          sub={`${overview.totalOrders || 0} orders this month`}
          icon={<FaChartBar />}
          accent="#1565c0"
          onClick={() => navigate("/reports")}
        />
        <StatCard
          title="Avg Order Value"
          value={formatMoney(overview.avgOrder)}
          sub="this month"
          icon={<FaBox />}
          accent="#2e7d32"
        />
        <StatCard
          title="Total Transactions"
          value={formatNum(overview.totalOrders)}
          sub={`${overview.todayOrders || 0} today`}
          icon={<FaReceipt />}
          accent="#7c3aed"
          onClick={() => navigate("/sales-history")}
        />
      </div>

      {/* MIDDLE SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

        {/* RECENT SALES */}
        <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Recent Sales</h3>
            <button onClick={() => navigate("/sales-history")} style={{ background: "transparent", border: "none", color: "#c9a84c", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              View All →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Cashier</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No sales yet</td></tr>
              ) : recentSales.map((s) => (
                <tr key={s.id} style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...tdStyle, fontWeight: "600", color: "#c9a84c" }}>#{s.id}</td>
                  <td style={tdStyle}>{s.cashierName || "N/A"}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: s.paymentMethod === "cash" ? "#e8f5e9" : "#e3f2fd",
                      color: s.paymentMethod === "cash" ? "#2e7d32" : "#1565c0",
                      padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", textTransform: "capitalize",
                    }}>
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOP PRODUCTS */}
        <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Top Products This Month</h3>
            <button onClick={() => navigate("/reports")} style={{ background: "transparent", border: "none", color: "#c9a84c", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              Full Report →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Qty Sold</th>
                <th style={thStyle}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No sales this month</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={i} style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...tdStyle, color: "#c9a84c", fontWeight: "700" }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                  <td style={tdStyle}>{p.totalQuantity}</td>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <QuickAction label="New Sale" icon={<FaCashRegister />} onClick={() => navigate("/sales")} />
          <QuickAction label="View Reports" icon={<FaChartBar />} onClick={() => navigate("/reports")} />
          <QuickAction label="Manage Products" icon={<FaBox />} onClick={() => navigate("/products")} />
          <QuickAction label="Sales History" icon={<FaHistory />} onClick={() => navigate("/sales-history")} />
        </div>
      </div>

    </div>
  );
}

const thStyle = { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#6b6b6b", borderBottom: "1px solid #e0ddd5", background: "#faf9f6", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "12px 14px", fontSize: "13px", borderBottom: "1px solid #f0ede6", color: "#2d2d2d" };
