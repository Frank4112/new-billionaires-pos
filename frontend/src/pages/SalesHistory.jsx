import { useEffect, useState, useRef } from "react";
import { FaReceipt, FaChevronRight, FaChevronLeft } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const SALES_URL = `${API_BASE_URL}/sales`;

const getHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (value) =>
  `KES ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getQuickRange = (key) => {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  const format = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const today = format(now);
  if (key === "today") return { from: today, to: today };
  if (key === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: format(start), to: today };
  }
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
};

const paymentBadge = (method) => {
  const style = method === "mpesa" ? mpesaBadgeStyle : cashBadgeStyle;
  return <span style={style}>{method || "unknown"}</span>;
};

export default function SalesHistory({ currentUser, isMySales = false }) {
  const [sales, setSales] = useState([]);
  const [selectedSaleItems, setSelectedSaleItems] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("All");
  const [quickFilter, setQuickFilter] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const tableScrollRef = useRef(null);

  const scroll = (direction) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: direction === "right" ? 160 : -160, behavior: "smooth" });
    }
  };

  const loadSales = async (range = getQuickRange(quickFilter)) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const params = new URLSearchParams();
      if (isMySales && currentUser?.id) params.set("userId", currentUser.id);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);
      const response = await fetch(`${SALES_URL}?${params.toString()}`, { headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Failed to fetch sales");
      setSales(Array.isArray(data) ? data : []);
      setSelectedSale(null);
      setSelectedSaleItems([]);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleItems = async (sale) => {
    if (selectedSale?.id === sale.id) {
      setSelectedSale(null);
      setSelectedSaleItems([]);
      return;
    }
    try {
      const response = await fetch(`${SALES_URL}/${sale.id}`, { headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch sale items");
      setSelectedSale(sale);
      setSelectedSaleItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Fixed DRY configuration - uses auth headers via internal wrapper safely
  useEffect(() => {
    const range = getQuickRange(quickFilter);
    loadSales(range);
  }, [quickFilter, currentUser?.id, isMySales]);

  const handleQuickFilter = (key) => {
    setQuickFilter(key);
    setCustomFrom("");
    setCustomTo("");
  };

  const handleCustomFilter = () => {
    if (!customFrom || !customTo) {
      setErrorMessage("Select both start and end dates");
      return;
    }
    loadSales({ from: customFrom, to: customTo });
  };

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const avgCheck = sales.length ? totalSales / sales.length : 0;
  const paymentMethods = ["All", ...new Set(sales.map((sale) => sale.paymentMethod).filter(Boolean))];

  const filteredSales = sales.filter((sale) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      String(sale.id).includes(searchValue) ||
      (sale.cashierName || "").toLowerCase().includes(searchValue);
    const matchesPayment = filterPayment === "All" || sale.paymentMethod === filterPayment;
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="page-shell sales-history-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={pageHeaderStyle}>
        <h1 style={titleStyle}>{isMySales ? "My Sales" : "Sales History"}</h1>
        <p style={subtitleStyle}>Review completed transactions and inspect receipt details.</p>
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {/* SUMMARY CARDS */}
      <div style={summaryGridStyle}>
        <SummaryCard label="Total Sales" value={formatMoney(totalSales)} />
        <SummaryCard label="Average Check" value={formatMoney(avgCheck)} />
        <SummaryCard label="Total Orders" value={sales.length} />
      </div>

      {/* FILTER PANEL */}
      <div style={filterPanelStyle}>
        <input
          type="text"
          placeholder={isMySales ? "Search by sale ID..." : "Search by sale ID or cashier..."}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={inputStyle}
        />
        <div style={buttonGroupStyle}>
          {["today", "week", "month"].map((key) => (
            <button key={key} onClick={() => handleQuickFilter(key)}
              style={quickFilter === key ? activeFilterButtonStyle : filterButtonStyle}>
              {key === "today" ? "Today" : key === "week" ? "Last 7 Days" : "This Month"}
            </button>
          ))}
        </div>
        <div style={customDateStyle}>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={dateInputStyle} />
          <span style={{ color: "#6b7280" }}>to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={dateInputStyle} />
          <button onClick={handleCustomFilter} style={activeFilterButtonStyle}>Apply</button>
        </div>
      </div>

      {/* PAYMENT FILTER */}
      <div style={paymentFilterStyle}>
        {paymentMethods.map((method) => (
          <button key={method} onClick={() => setFilterPayment(method)}
            style={filterPayment === method ? activeFilterButtonStyle : filterButtonStyle}>
            {method}
          </button>
        ))}
      </div>

      {/* CONTENT GRID */}
      <div style={contentGridStyle}>

        {/* TABLE CARD CONTAINER */}
        <div style={tableCardStyle}>

          {/* Scroll Navigation Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #e0ddd5", background: "#f5f3ee" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transactions Ledger</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => scroll("left")} style={scrollBtnStyle} title="Scroll left">
                <FaChevronLeft size={11} />
              </button>
              <button onClick={() => scroll("right")} style={scrollBtnStyle} title="Scroll right">
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>

          {/* Scrollable table window with constrained layout width */}
          <div ref={tableScrollRef} style={{ overflowX: "auto", width: "100%", scrollBehavior: "smooth" }}>
            <table style={{ ...tableStyle, minWidth: "640px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Sale</th>
                  {!isMySales && <th style={thStyle}>Cashier</th>}
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle} dangerouslySetComment={{__html: "&nbsp;"}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={isMySales ? 5 : 6} style={emptyCellStyle}>Loading sales...</td></tr>
                )}
                {!loading && filteredSales.length === 0 && (
                  <tr><td colSpan={isMySales ? 5 : 6} style={emptyCellStyle}>No sales found</td></tr>
                )}
                {!loading && filteredSales.map((sale) => (
                  <tr key={sale.id}
                    style={{ background: selectedSale?.id === sale.id ? "#faf8f2" : "transparent", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { if (selectedSale?.id !== sale.id) e.currentTarget.style.background = "#faf9f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedSale?.id === sale.id ? "#faf8f2" : "transparent"; }}
                  >
                    <td style={{ ...tdStyle, fontWeight: "700", color: "#c9a84c" }}>#{sale.id}</td>
                    {!isMySales && <td style={tdStyle}>{sale.cashierName || "N/A"}</td>}
                    <td style={tdStyle}>{paymentBadge(sale.paymentMethod)}</td>
                    <td style={{ ...tdStyle, fontWeight: "700" }}>{formatMoney(sale.totalAmount)}</td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>{formatDate(sale.createdAt)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", paddingRight: "16px" }}>
                      <button onClick={() => fetchSaleItems(sale)} style={{
                        ...viewIconButtonStyle,
                        background: selectedSale?.id === sale.id ? "#c9a84c" : "#1a1a2e",
                        color: selectedSale?.id === sale.id ? "#1a1a2e" : "#c9a84c",
                      }} title="View receipt">
                        <FaReceipt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECEIPT PANEL */}
        <ReceiptPanel sale={selectedSale} items={selectedSaleItems} isMySales={isMySales} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryLabelStyle}>{label}</p>
      <strong style={summaryValueStyle}>{value}</strong>
    </div>
  );
}

function ReceiptPanel({ sale, items, isMySales }) {
  if (!sale) {
    return (
      <aside className="receipt-panel" style={receiptCardStyle}>
        <div style={receiptEmptyStyle}>Select a sale to view its receipt.</div>
      </aside>
    );
  }

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  return (
    <aside className="receipt-panel" style={receiptCardStyle}>
      <div style={receiptHeaderStyle}>
        <div style={receiptLogoStyle}>NB</div>
        <h3 style={receiptTitleStyle}>New Billionaires</h3>
        <p style={receiptSubtitleStyle}>Bar & Restaurant</p>
      </div>

      <div style={receiptMetaStyle}>
        {[
          { label: "Receipt", value: `#${sale.id}` },
          ...(!isMySales ? [{ label: "Cashier", value: sale.cashierName || "N/A" }] : []),
          { label: "Date", value: formatDate(sale.createdAt) },
          { label: "Payment", value: sale.paymentMethod },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "#6b7280" }}>{row.label}</span>
            <strong style={{ color: "#1a1a2e", textTransform: "capitalize" }}>{row.value}</strong>
          </div>
        ))}
      </div>

      <div style={receiptItemsStyle}>
        {items.map((item) => (
          <div key={item.id} style={receiptItemStyle}>
            <div>
              <strong>{item.name}</strong>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>{item.quantity} x {formatMoney(item.price)}</p>
            </div>
            <strong>{formatMoney(Number(item.price) * Number(item.quantity))}</strong>
          </div>
        ))}
      </div>

      <div style={receiptTotalStyle}>
        <span>Total</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </aside>
  );
}

// STYLES OBJECTS
const pageHeaderStyle = { marginBottom: "20px" };
const titleStyle = { color: "#1a1a2e", fontSize: "30px", margin: "0 0 6px" };
const subtitleStyle = { color: "#6b7280", fontSize: "15px", margin: 0 };

const summaryGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
  gap: "16px", 
  marginBottom: "20px" 
};

const summaryCardStyle = { background: "#ffffff", border: "1px solid #e0ddd5", borderRadius: "8px", borderTop: "3px solid #c9a84c", padding: "18px 20px" };
const summaryLabelStyle = { color: "#6b6b6b", fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.07em" };
const summaryValueStyle = { color: "#1a1a2e", fontSize: "22px" };

const filterPanelStyle = { 
  background: "#ffffff", 
  border: "1px solid #e0ddd5", 
  borderRadius: "8px", 
  padding: "14px", 
  display: "flex", 
  alignItems: "center", 
  flexWrap: "wrap", 
  gap: "12px", 
  marginBottom: "12px" 
};

const inputStyle = { width: "250px", padding: "10px 12px", border: "1px solid #d0cdc6", borderRadius: "7px", outline: "none" };
const buttonGroupStyle = { display: "flex", gap: "8px", flexWrap: "wrap" };
const filterButtonStyle = { padding: "9px 13px", background: "#ffffff", color: "#4a4a4a", border: "1px solid #d0cdc6", borderRadius: "7px", cursor: "pointer", fontWeight: "600" };
const activeFilterButtonStyle = { ...filterButtonStyle, background: "#1a1a2e", color: "#c9a84c", border: "1px solid #c9a84c" };
const customDateStyle = { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" };
const dateInputStyle = { padding: "9px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", outline: "none" };
const paymentFilterStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" };

const contentGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
  gap: "20px", 
  alignItems: "start",
  maxWidth: "100%"
};

const tableCardStyle = { 
  background: "#ffffff", 
  border: "1px solid #e0ddd5", 
  borderRadius: "8px", 
  overflow: "hidden",
  width: "100%",
  maxWidth: "100%"
};

const scrollBtnStyle = { background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "6px", width: "32px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "12px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#1a1a2e", borderBottom: "1px solid #e0ddd5", background: "#f5f3ee", whiteSpace: "nowrap" };
const tdStyle = { padding: "13px 12px", fontSize: "14px", color: "#2d2d2d", borderBottom: "1px solid #e8e5de", whiteSpace: "nowrap" };
const emptyCellStyle = { ...tdStyle, textAlign: "center", color: "#888", padding: "40px" };
const viewIconButtonStyle = { border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "700", width: "38px", height: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" };
const cashBadgeStyle = { background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" };
const mpesaBadgeStyle = { ...cashBadgeStyle, background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb" };
const receiptCardStyle = { background: "#ffffff", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "20px", minWidth: "320px", position: "sticky", top: "0" };
const receiptEmptyStyle = { color: "#6b7280", textAlign: "center", padding: "80px 20px", border: "1px dashed #d0cdc6", borderRadius: "8px" };
const receiptHeaderStyle = { textAlign: "center", paddingBottom: "16px", borderBottom: "1px dashed #d0cdc6" };
const receiptLogoStyle = { width: "42px", height: "42px", borderRadius: "50%", background: "#1a1a2e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontFamily: "Georgia, serif", fontWeight: "800" };
const receiptTitleStyle = { margin: 0, color: "#1a1a2e", fontFamily: "Georgia, serif", textTransform: "uppercase" };
const receiptSubtitleStyle = { color: "#6b7280", fontSize: "12px", margin: "4px 0 0", textTransform: "uppercase" };
const receiptMetaStyle = { display: "grid", gap: "10px", padding: "16px 0", borderBottom: "1px dashed #d0cdc6" };
const receiptItemsStyle = { display: "grid", gap: "12px", padding: "16px 0", borderBottom: "1px dashed #d0cdc6" };
const receiptItemStyle = { display: "flex", justifyContent: "space-between", gap: "12px" };
const receiptTotalStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", fontSize: "18px" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" };