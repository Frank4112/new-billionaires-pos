import { useEffect, useState, useCallback } from "react";


const API_BASE_URL = import.meta.env.VITE_API_URL;

const REPORTS_URL = `${API_BASE_URL}/reports`;

const getHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem("token")}` });
const formatMoney = (v) => `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNum = (v) => Number(v || 0).toLocaleString();

// ─── PIE CHART ───────────────────────────────────────────────
function PieChart({ data, colors }) {
  const total = data.reduce((s, d) => s + Number(d.value), 0);
  if (total === 0) return <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>No data</p>;
  const slices = data.reduce((items, d, i) => {
    const cumulative = items.reduce((sum, item) => sum + item.pct, 0);
    const pct = Number(d.value) / total;
    const startAngle = cumulative * 2 * Math.PI;
    const endAngle = (cumulative + pct) * 2 * Math.PI;
    const x1 = Math.cos(startAngle - Math.PI / 2);
    const y1 = Math.sin(startAngle - Math.PI / 2);
    const x2 = Math.cos(endAngle - Math.PI / 2);
    const y2 = Math.sin(endAngle - Math.PI / 2);
    const large = pct > 0.5 ? 1 : 0;
    return [
      ...items,
      { ...d, x1, y1, x2, y2, large, pct, color: colors[i % colors.length] },
    ];
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
      <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: "180px", height: "180px", flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={`M 0 0 L ${s.x1} ${s.y1} A 1 1 0 ${s.large} 1 ${s.x2} ${s.y2} Z`} fill={s.color} stroke="#fff" strokeWidth="0.03" />
        ))}
        <circle cx="0" cy="0" r="0.55" fill="#fff" />
        <text x="0" y="0.08" textAnchor="middle" fontSize="0.22" fontWeight="700" fill="#1a1a2e">{data.length}</text>
        <text x="0" y="0.32" textAnchor="middle" fontSize="0.14" fill="#888">methods</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: s.color, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", textTransform: "capitalize", color: "#1a1a2e" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{formatMoney(s.value)} · {(s.pct * 100).toFixed(1)}% · {s.count} orders</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = "#c9a84c", formatValue }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey] || 0)), 1);
  const fmt = formatValue || ((v) => Number(v) > 999 ? formatMoney(v) : formatNum(v));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "120px", fontSize: "12px", color: "#4a4a4a", textAlign: "right", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d[labelKey]}</div>
          <div style={{ flex: 1, background: "#f0ede6", borderRadius: "4px", height: "22px" }}>
            <div style={{ width: `${(Number(d[valueKey]) / max) * 100}%`, background: color, height: "100%", borderRadius: "4px", transition: "width 0.5s ease", minWidth: "4px" }} />
          </div>
          <div style={{ width: "100px", fontSize: "12px", fontWeight: "600", color: "#1a1a2e", flexShrink: 0 }}>{fmt(d[valueKey])}</div>
        </div>
      ))}
    </div>
  );
}

const thStyle = { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#6b6b6b", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "11px 14px", fontSize: "14px", borderBottom: "1px solid #e8e5de", color: "#2d2d2d" };
const hoverRow = {
  onMouseEnter: (e) => e.currentTarget.style.background = "#faf9f6",
  onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
  style: { transition: "background 0.15s", cursor: "default" },
};

function StatCard({ label, value, sub, accent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1a1a2e" : "#fff",
        border: `1px solid ${hovered ? "#1a1a2e" : "#e0ddd5"}`,
        borderRadius: "10px",
        padding: "18px 20px",
        borderTop: `3px solid ${accent || "#c9a84c"}`,
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <p style={{ color: hovered ? "#9ca3af" : "#6b6b6b", fontSize: "11px", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: "600" }}>{label}</p>
      <p style={{ color: hovered ? "#ffffff" : "#1a1a2e", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }}>{value}</p>
      {sub && <p style={{ color: hovered ? "#6b7280" : "#9ca3af", fontSize: "12px", margin: 0 }}>{sub}</p>}
    </div>
  );
}


const TABS = ["Overview", "Sales Trends", "Products", "Cashiers", "Stock"];

const getQuickRange = (key) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  switch (key) {
    case "today": return { from: today, to: today };
    case "week": { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: fmt(d), to: today }; }
    case "month": return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
    case "year": return { from: `${now.getFullYear()}-01-01`, to: today };
    default: return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
  }
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [quickFilter, setQuickFilter] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [productView, setProductView] = useState("quantity");

  const fetchReports = useCallback(async (from, to) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${REPORTS_URL}?from=${from}&to=${to}`, { headers: getHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setData(d);
    } catch { setError("Failed to load reports."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let isActive = true;
    const { from, to } = getQuickRange(quickFilter);

    fetch(`${REPORTS_URL}?from=${from}&to=${to}`, { headers: getHeaders() })
      .then((res) =>
        res.json().then((d) => {
          if (!res.ok) {
            throw new Error(d.error || "Failed");
          }

          return d;
        })
      )
      .then((d) => {
        if (isActive) {
          setData(d);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("Failed to load reports.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [quickFilter]);

  const handleCustomFilter = () => {
    if (!customFrom || !customTo) return;
    fetchReports(customFrom, customTo);
  };

  const tabBtn = (name) => ({
    padding: "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
    background: activeTab === name ? "#1a1a2e" : "transparent",
    color: activeTab === name ? "#c9a84c" : "#6b7280",
    transition: "all 0.15s",
  });

  const quickBtn = (key, label) => (
    <button key={key} onClick={() => {
      setLoading(true);
      setError("");
      setQuickFilter(key);
    }} style={{
      padding: "7px 14px", borderRadius: "7px",
      border: quickFilter === key ? "1px solid #c9a84c" : "1px solid #d0cdc6",
      background: quickFilter === key ? "#1a1a2e" : "#fff",
      color: quickFilter === key ? "#c9a84c" : "#4a4a4a",
      cursor: "pointer", fontWeight: "500", fontSize: "13px",
    }}>{label}</button>
  );

  return (
    <div className="page-shell reports-page" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "700", margin: "0 0 4px" }}>Reports & Analytics</h1>
        <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Deep dive into sales, products, and staff performance.</p>
      </div>

      {/* FILTERS */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {quickBtn("today", "Today")}
          {quickBtn("week", "Last 7 Days")}
          {quickBtn("month", "This Month")}
          {quickBtn("year", "This Year")}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
          <span style={{ fontSize: "13px", color: "#6b6b6b" }}>Custom:</span>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
          <span style={{ color: "#888" }}>to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
          <button onClick={handleCustomFilter} style={{ padding: "7px 14px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Apply</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "4px", background: "#f5f3ee", borderRadius: "10px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
        {TABS.map((t) => <button key={t} onClick={() => setActiveTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>Loading reports...</div>}
      {error && <div style={{ textAlign: "center", padding: "60px", color: "#991b1b" }}>{error}</div>}

      {!loading && !error && data && (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "Overview" && (() => {
            const ps = data.profitSummary || {};
            const revenue = Number(ps.totalRevenue || 0);
            const cost = Number(ps.totalCost || 0);
            const profit = Number(ps.grossProfit || 0);
            const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
            const hasCostData = cost > 0;

            return (
              <div>
                {/* Sales cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "16px" }}>
                  <StatCard label="Total Revenue" value={formatMoney(data.overview.totalRevenue)} sub={`${formatNum(data.overview.totalOrders)} orders`} />
                  <StatCard label="Avg Order Value" value={formatMoney(data.overview.avgOrder)} sub="per transaction" accent="#1a1a2e" />
                  <StatCard label="Today's Revenue" value={formatMoney(data.overview.todayRevenue)} sub={`${formatNum(data.overview.todayOrders)} orders today`} accent="#2e7d32" />
                  <StatCard label="Total Orders" value={formatNum(data.overview.totalOrders)} sub="in selected period" accent="#1565c0" />
                </div>

                {/* Profit cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                  <StatCard
                    label="Bar Cost of Goods Sold"
                    value={hasCostData ? formatMoney(cost) : "Set cost prices"}
                    sub={hasCostData ? "total purchase cost" : "in Stock Management"}
                    accent="#dc2626"
                  />
                  <StatCard
                    label="Bar Gross Profit"
                    value={hasCostData ? formatMoney(profit) : "—"}
                    sub={hasCostData ? "revenue minus cost" : "requires cost prices"}
                    accent={profit >= 0 ? "#2e7d32" : "#dc2626"}
                  />
                  <StatCard
                    label="Bar Profit Margin"
                    value={hasCostData ? `${margin}%` : "—"}
                    sub={hasCostData ? `${formatMoney(profit)} on ${formatMoney(revenue)}` : "requires cost prices"}
                    accent={Number(margin) >= 30 ? "#2e7d32" : Number(margin) >= 10 ? "#d97706" : "#dc2626"}
                  />
                </div>

                {/* Profit note if no cost data */}
                {!hasCostData && (
                  <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", fontSize: "13px", color: "#92400e" }}>
                    ⚠️ Profit data requires cost prices to be set. Go to <strong>Stock Management</strong> and record stock in with cost prices to enable profit tracking.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Payment Methods</h3>
                    <PieChart
                      data={data.paymentBreakdown.map((p) => ({ label: p.method, value: Number(p.total), count: p.count }))}
                      colors={["#c9a84c", "#1a1a2e", "#4ade80", "#60a5fa"]}
                    />
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Revenue by Cashier</h3>
                    {data.byCashier.length === 0
                      ? <p style={{ color: "#888" }}>No data for this period</p>
                      : <BarChart data={data.byCashier} labelKey="cashier" valueKey="totalRevenue" color="#c9a84c" />
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── SALES TRENDS TAB ── */}
          {activeTab === "Sales Trends" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Daily Revenue Trend</h3>
                {data.dailyTrend.length === 0 ? <p style={{ color: "#888" }}>No data for this period</p>
                  : <BarChart data={data.dailyTrend.map((d) => ({ ...d, date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }))} labelKey="date" valueKey="revenue" color="#c9a84c" />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Orders Per Day</h3>
                  {data.dailyTrend.length === 0 ? <p style={{ color: "#888" }}>No data</p>
                    : <BarChart data={data.dailyTrend.map((d) => ({ ...d, date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }))} labelKey="date" valueKey="orders" color="#1a1a2e" formatValue={formatNum} />}
                </div>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Busiest Hours</h3>
                  {data.hourlyTrend.length === 0 ? <p style={{ color: "#888" }}>No sales today</p>
                    : <BarChart data={data.hourlyTrend.map((h) => ({ ...h, hour: `${String(h.hour).padStart(2, "0")}:00` }))} labelKey="hour" valueKey="orders" color="#c9a84c" formatValue={formatNum} />}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Monthly Revenue — {new Date(data.dateRange.end).getFullYear()}</h3>
                {data.monthlyTrend.length === 0 ? <p style={{ color: "#888" }}>No data</p>
                  : <BarChart data={data.monthlyTrend.map((m) => ({ ...m, month: new Date(m.month + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" }) }))} labelKey="month" valueKey="revenue" color="#1a1a2e" />}
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === "Products" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {["quantity", "revenue"].map((v) => (
                  <button key={v} onClick={() => setProductView(v)} style={{
                    padding: "8px 16px", borderRadius: "8px",
                    border: productView === v ? "1px solid #c9a84c" : "1px solid #d0cdc6",
                    background: productView === v ? "#1a1a2e" : "#fff",
                    color: productView === v ? "#c9a84c" : "#4a4a4a",
                    cursor: "pointer", fontWeight: "600", fontSize: "13px", textTransform: "capitalize",
                  }}>By {v}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Bar vs Food Revenue</h3>
                  {(data.itemTypeBreakdown || []).length === 0
                    ? <p style={{ color: "#888" }}>No sales data for this period</p>
                    : <BarChart data={data.itemTypeBreakdown} labelKey="type" valueKey="totalRevenue" color="#1a1a2e" formatValue={formatMoney} />
                  }
                </div>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Bar vs Food Units Sold</h3>
                  {(data.itemTypeBreakdown || []).length === 0
                    ? <p style={{ color: "#888" }}>No sales data for this period</p>
                    : <BarChart data={data.itemTypeBreakdown} labelKey="type" valueKey="totalQuantity" color="#c9a84c" formatValue={formatNum} />
                  }
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                  Top Products by {productView === "quantity" ? "Units Sold" : "Revenue"}
                </h3>
                {(productView === "quantity" ? data.topByQuantity : data.topByRevenue).length === 0
                  ? <p style={{ color: "#888" }}>No sales data for this period</p>
                  : <BarChart
                      data={productView === "quantity" ? data.topByQuantity : data.topByRevenue}
                      labelKey="name"
                      valueKey={productView === "quantity" ? "totalQuantity" : "totalRevenue"}
                      color="#c9a84c"
                      formatValue={productView === "quantity" ? formatNum : formatMoney}
                    />
                }
              </div>

              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                  Top Food Items by {productView === "quantity" ? "Units Sold" : "Revenue"}
                </h3>
                {(productView === "quantity" ? data.foodByQuantity || [] : data.foodByRevenue || []).length === 0
                  ? <p style={{ color: "#888" }}>No food sales data for this period</p>
                  : <BarChart
                      data={productView === "quantity" ? data.foodByQuantity : data.foodByRevenue}
                      labelKey="name"
                      valueKey={productView === "quantity" ? "totalQuantity" : "totalRevenue"}
                      color="#2e7d32"
                      formatValue={productView === "quantity" ? formatNum : formatMoney}
                    />
                }
              </div>

              {/* Product profit table */}
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Qty Sold</th>
                      <th style={thStyle}>Revenue</th>
                      <th style={thStyle}>Cost</th>
                      <th style={thStyle}>Profit</th>
                      <th style={thStyle}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(productView === "quantity" ? data.topByQuantity : data.topByRevenue).length === 0 ? (
                      <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No data</td></tr>
                    ) : (productView === "quantity" ? data.topByQuantity : data.topByRevenue).map((p, i) => {
                      const profit = Number(p.totalProfit || 0);
                      const revenue = Number(p.totalRevenue || 0);
                      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(0) : 0;
                      const hasCost = Number(p.costPrice) > 0;
                      return (
                        <tr key={i} {...hoverRow}>
                          <td style={{ ...tdStyle, color: "#c9a84c", fontWeight: "700" }}>{i + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                          <td style={tdStyle}>
                            <span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>
                              {p.category || "Uncategorized"}
                            </span>
                          </td>
                          <td style={tdStyle}>{formatNum(p.totalQuantity)}</td>
                          <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(p.totalRevenue)}</td>
                          <td style={tdStyle}>{hasCost ? formatMoney(p.totalCost) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not set</span>}</td>
                          <td style={{ ...tdStyle, fontWeight: "600", color: profit >= 0 ? "#2e7d32" : "#dc2626" }}>
                            {hasCost ? formatMoney(profit) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            {hasCost ? (
                              <span style={{
                                background: Number(margin) >= 30 ? "#e8f5e9" : Number(margin) >= 10 ? "#fff8e1" : "#fef2f2",
                                color: Number(margin) >= 30 ? "#2e7d32" : Number(margin) >= 10 ? "#d97706" : "#dc2626",
                                padding: "2px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                              }}>{margin}%</span>
                            ) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Food Performance</h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Food Item</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Qty Sold</th>
                      <th style={thStyle}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(productView === "quantity" ? data.foodByQuantity || [] : data.foodByRevenue || []).length === 0 ? (
                      <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No food sales data</td></tr>
                    ) : (productView === "quantity" ? data.foodByQuantity : data.foodByRevenue).map((item, i) => (
                      <tr key={i} {...hoverRow}>
                        <td style={{ ...tdStyle, color: "#2e7d32", fontWeight: "700" }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.name}</td>
                        <td style={tdStyle}>
                          <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>
                            Food
                          </span>
                        </td>
                        <td style={tdStyle}>{formatNum(item.totalQuantity)}</td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CASHIERS TAB ── */}
          {activeTab === "Cashiers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Revenue by Cashier</h3>
                  {data.byCashier.length === 0 ? <p style={{ color: "#888" }}>No data</p>
                    : <BarChart data={data.byCashier} labelKey="cashier" valueKey="totalRevenue" color="#c9a84c" />}
                </div>
                <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>Orders by Cashier</h3>
                  {data.byCashier.length === 0 ? <p style={{ color: "#888" }}>No data</p>
                    : <BarChart data={data.byCashier} labelKey="cashier" valueKey="totalOrders" color="#1a1a2e" formatValue={formatNum} />}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Cashier</th>
                      <th style={thStyle}>Total Orders</th>
                      <th style={thStyle}>Total Revenue</th>
                      <th style={thStyle}>Avg Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byCashier.length === 0 ? (
                      <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No data</td></tr>
                    ) : data.byCashier.map((c, i) => (
                      <tr key={i} {...hoverRow}>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{c.cashier}</td>
                        <td style={tdStyle}>{formatNum(c.totalOrders)}</td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(c.totalRevenue)}</td>
                        <td style={{ ...tdStyle, color: "#6b6b6b" }}>{formatMoney(c.avgSale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STOCK TAB ── */}
          {activeTab === "Stock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>⚠️ Low Stock Alert</h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Current Stock</th>
                      <th style={thStyle}>Minimum</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStock.length === 0 ? (
                      <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#2e7d32" }}>✅ All products are well stocked</td></tr>
                    ) : data.lowStock.map((p, i) => (
                      <tr key={i} {...hoverRow}>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                        <td style={tdStyle}>{p.category || "Uncategorized"}</td>
                        <td style={{ ...tdStyle, color: p.stock_quantity === 0 ? "#dc2626" : "#d97706", fontWeight: "700" }}>{p.stock_quantity}</td>
                        <td style={{ ...tdStyle, color: "#6b6b6b" }}>{p.minimum_stock}</td>
                        <td style={tdStyle}>
                          <span style={{
                            background: p.stock_quantity === 0 ? "#fef2f2" : "#fff8e1",
                            color: p.stock_quantity === 0 ? "#dc2626" : "#d97706",
                            border: `1px solid ${p.stock_quantity === 0 ? "#fecaca" : "#fde68a"}`,
                            padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                          }}>
                            {p.stock_quantity === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Stock Movements</h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Quantity</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stockMovements.length === 0 ? (
                      <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No movements in this period</td></tr>
                    ) : data.stockMovements.map((m, i) => (
                      <tr key={i} {...hoverRow}>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{m.name}</td>
                        <td style={tdStyle}>
                          <span style={{
                            background: m.type === "IN" ? "#e8f5e9" : "#fef2f2",
                            color: m.type === "IN" ? "#2e7d32" : "#dc2626",
                            border: `1px solid ${m.type === "IN" ? "#c8e6c9" : "#fecaca"}`,
                            padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                          }}>
                            {m.type === "IN" ? "Stock In" : "Stock Out"}
                          </span>
                        </td>
                        <td style={tdStyle}>{m.quantity}</td>
                        <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px" }}>{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
