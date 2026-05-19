import { useEffect, useState, useRef } from "react";
import { FaPlus, FaBoxOpen, FaSearch } from "react-icons/fa";

const STOCK_URL = "http://localhost:5000/api/stock";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (v) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const thStyle = {
  padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600",
  color: "#6b6b6b", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee",
  textTransform: "uppercase", letterSpacing: "0.05em",
};
const tdStyle = { padding: "12px 14px", fontSize: "14px", borderBottom: "1px solid #e8e5de", color: "#2d2d2d" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a1a2e", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #d0cdc6", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#faf9f6", boxSizing: "border-box" };

// ── SEARCHABLE PRODUCT DROPDOWN ──────────────────────────────
function ProductSearch({ products, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = products.find((p) => p.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => { setOpen(!open); setQuery(""); }}
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ color: selected ? "#1a1a2e" : "#9ca3af" }}>
          {selected ? `${selected.name} ${selected.category ? `(${selected.category})` : ""}` : "Search or select a product..."}
        </span>
        <FaSearch style={{ color: "#9ca3af", fontSize: "12px" }} />
      </div>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d0cdc6", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, maxHeight: "260px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px" }}>
            <input
              autoFocus
              type="text"
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...inputStyle, padding: "8px 12px", fontSize: "13px" }}
            />
          </div>
          <div style={{ overflowY: "auto", maxHeight: "200px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", color: "#888", fontSize: "13px" }}>No products found</div>
            ) : filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between",
                  background: value === p.id ? "#f5f3ee" : "transparent",
                  borderLeft: value === p.id ? "3px solid #c9a84c" : "3px solid transparent",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = value === p.id ? "#f5f3ee" : "transparent"}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#1a1a2e" }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6b6b6b" }}>
                    {p.category || "Uncategorized"} · Stock: {p.stock_quantity}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{formatMoney(p.selling_price)}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>selling price</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stockSearch, setStockSearch] = useState("");

  // Existing product form
  const [productId, setProductId] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");

  // New product form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newMinStock, setNewMinStock] = useState("5");

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${STOCK_URL}/products`, { headers: getAuthHeaders() });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load products."); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${STOCK_URL}/history?from=${from}&to=${to}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load stock history."); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialStockData = async () => {
      try {
        const [productsRes, historyRes] = await Promise.all([
          fetch(`${STOCK_URL}/products`, { headers: getAuthHeaders() }),
          fetch(`${STOCK_URL}/history?from=${monthStart}&to=${today}`, {
            headers: getAuthHeaders(),
          }),
        ]);

        const [productsData, historyData] = await Promise.all([
          productsRes.json(),
          historyRes.json(),
        ]);

        if (isActive) {
          setProducts(Array.isArray(productsData) ? productsData : []);
          setHistory(Array.isArray(historyData) ? historyData : []);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Failed to load stock data.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    };

    loadInitialStockData();

    return () => {
      isActive = false;
    };
  }, [monthStart, today]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const handleProductSelect = (id) => {
    setProductId(id);
    const p = products.find((p) => p.id === id);
    if (p && p.cost_price > 0) setCostPrice(p.cost_price);
    else setCostPrice("");
  };

  const resetForm = () => {
    setProductId(null); setQuantity(""); setCostPrice("");
    setNewName(""); setNewCategory(""); setNewSellingPrice("");
    setNewCostPrice(""); setNewQuantity(""); setNewMinStock("5");
  };

  const handleStockIn = async () => {
    if (!productId || !quantity || costPrice === "") {
      setErrorMessage("All fields are required."); return;
    }
    try {
      const res = await fetch(`${STOCK_URL}/in`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity: Number(quantity), costPrice: Number(costPrice) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Stock recorded successfully!");
      resetForm(); setShowForm(false);
      await fetchProducts(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleNewProduct = async () => {
    if (!newName || !newSellingPrice || !newQuantity) {
      setErrorMessage("Name, selling price and quantity are required."); return;
    }
    try {
      const res = await fetch(`${STOCK_URL}/new-product`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newName, category: newCategory,
          sellingPrice: Number(newSellingPrice), costPrice: Number(newCostPrice || 0),
          quantity: Number(newQuantity), minimumStock: Number(newMinStock || 5),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage("Product created and stock recorded!");
      resetForm(); setShowForm(false); setIsNewProduct(false);
      await fetchProducts(); await fetchHistory();
    } catch (err) { setErrorMessage(err.message); }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const totalCostThisPeriod = history.reduce((s, h) => s + Number(h.totalCost || 0), 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(stockSearch.toLowerCase())
  );

  return (
    <div className="page-shell stock-page" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>

      {/* HEADER */}
      <div className="page-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "700", margin: "0 0 4px" }}>Stock Management</h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Record stock purchases and track inventory costs.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); resetForm(); setIsNewProduct(false); }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 18px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
        >
          <FaPlus /> {showForm ? "Cancel" : "Record Stock In"}
        </button>
      </div>

      {errorMessage && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{errorMessage}</div>}
      {successMessage && <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{successMessage}</div>}

      {/* FORM */}
      {showForm && (
        <div className="panel-card" style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>

          {/* Toggle existing / new */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {["existing", "new"].map((type) => (
              <button
                key={type}
                onClick={() => { setIsNewProduct(type === "new"); resetForm(); }}
                style={{
                  padding: "8px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer",
                  background: (type === "new") === isNewProduct ? "#1a1a2e" : "#fff",
                  color: (type === "new") === isNewProduct ? "#c9a84c" : "#4a4a4a",
                  border: (type === "new") === isNewProduct ? "1px solid #1a1a2e" : "1px solid #d0cdc6",
                }}
              >
                {type === "existing" ? "📦 Existing Product" : "✨ New Product"}
              </button>
            ))}
          </div>

          {/* EXISTING PRODUCT FORM */}
          {!isNewProduct && (
            <>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Stock In — Existing Product</h3>
              <div className="responsive-form-grid stock-existing-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Product</label>
                  <ProductSearch products={products} value={productId} onChange={handleProductSelect} />
                </div>
                <div>
                  <label style={labelStyle}>Quantity Received</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 24" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Cost Price per Unit (KES)</label>
                  <input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="e.g. 150" style={inputStyle} />
                </div>
              </div>

              {/* Preview */}
              {selectedProduct && quantity && costPrice !== "" && (
                <div style={{ background: "#f5f3ee", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
                  {[
                    { label: "Current Stock", value: selectedProduct.stock_quantity },
                    { label: "Adding", value: `+${quantity}`, color: "#2e7d32" },
                    { label: "New Stock", value: Number(selectedProduct.stock_quantity) + Number(quantity), color: "#2e7d32" },
                    { label: "Total Cost", value: formatMoney(Number(quantity) * Number(costPrice)) },
                    { label: "Selling Price", value: formatMoney(selectedProduct.selling_price) },
                    { label: "Profit/Unit", value: formatMoney(Number(selectedProduct.selling_price) - Number(costPrice)), color: Number(selectedProduct.selling_price) - Number(costPrice) >= 0 ? "#2e7d32" : "#dc2626" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleStockIn} style={{ padding: "10px 20px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Confirm Stock In
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: "10px 20px", background: "#eef1f5", color: "#1a1a2e", border: "1px solid #d0cdc6", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* NEW PRODUCT FORM */}
          {isNewProduct && (
            <>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Add New Product + Initial Stock</h3>
              <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Heineken" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Beer, Spirits, Food" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Minimum Stock Level</label>
                  <input type="number" min="0" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="5" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Selling Price (KES) *</label>
                  <input type="number" min="0" step="0.01" value={newSellingPrice} onChange={(e) => setNewSellingPrice(e.target.value)} placeholder="e.g. 300" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Cost Price per Unit (KES)</label>
                  <input type="number" min="0" step="0.01" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="e.g. 180" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Initial Stock Quantity *</label>
                  <input type="number" min="1" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="e.g. 50" style={inputStyle} />
                </div>
              </div>

              {/* Preview */}
              {newName && newSellingPrice && newCostPrice && newQuantity && (
                <div style={{ background: "#f5f3ee", border: "1px solid #e0ddd5", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
                  {[
                    { label: "Product", value: newName },
                    { label: "Initial Stock", value: newQuantity, color: "#2e7d32" },
                    { label: "Total Cost", value: formatMoney(Number(newQuantity) * Number(newCostPrice)) },
                    { label: "Selling Price", value: formatMoney(newSellingPrice) },
                    { label: "Profit/Unit", value: formatMoney(Number(newSellingPrice) - Number(newCostPrice)), color: Number(newSellingPrice) - Number(newCostPrice) >= 0 ? "#2e7d32" : "#dc2626" },
                    { label: "Margin", value: `${newSellingPrice > 0 ? (((newSellingPrice - newCostPrice) / newSellingPrice) * 100).toFixed(0) : 0}%`, color: "#1565c0" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: item.color || "#1a1a2e" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleNewProduct} style={{ padding: "10px 20px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Create Product & Record Stock
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); setIsNewProduct(false); }} style={{ padding: "10px 20px", background: "#eef1f5", color: "#1a1a2e", border: "1px solid #d0cdc6", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CURRENT STOCK LEVELS */}
      <div className="responsive-table-card" style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBoxOpen style={{ color: "#c9a84c" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Current Stock Levels</h3>
          </div>
          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "12px" }} />
            <input
              type="text" placeholder="Search products..."
              value={stockSearch} onChange={(e) => setStockSearch(e.target.value)}
              style={{ padding: "7px 12px 7px 30px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none", width: "200px" }}
            />
          </div>
        </div>
        <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>In Stock</th>
              <th style={thStyle}>Min Stock</th>
              <th style={thStyle}>Cost Price</th>
              <th style={thStyle}>Selling Price</th>
              <th style={thStyle}>Margin</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No products found</td></tr>
            ) : filteredProducts.map((p) => {
              const margin = Number(p.selling_price) - Number(p.cost_price);
              const marginPct = Number(p.selling_price) > 0 ? ((margin / Number(p.selling_price)) * 100).toFixed(0) : 0;
              const isLow = p.stock_quantity <= p.minimum_stock;
              const isOut = p.stock_quantity === 0;
              return (
                <tr key={p.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  style={{ transition: "background 0.15s" }}
                >
                  <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                  <td style={tdStyle}>
                    <span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>
                      {p.category || "Uncategorized"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "700", color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32" }}>{p.stock_quantity}</td>
                  <td style={{ ...tdStyle, color: "#6b6b6b" }}>{p.minimum_stock}</td>
                  <td style={tdStyle}>{p.cost_price > 0 ? formatMoney(p.cost_price) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not set</span>}</td>
                  <td style={tdStyle}>{formatMoney(p.selling_price)}</td>
                  <td style={{ ...tdStyle, fontWeight: "600", color: margin >= 0 ? "#2e7d32" : "#dc2626" }}>
                    {p.cost_price > 0 ? `${formatMoney(margin)} (${marginPct}%)` : <span style={{ color: "#9ca3af", fontSize: "12px" }}>Set cost price</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: isOut ? "#fef2f2" : isLow ? "#fff8e1" : "#e8f5e9",
                      color: isOut ? "#dc2626" : isLow ? "#d97706" : "#2e7d32",
                      border: `1px solid ${isOut ? "#fecaca" : isLow ? "#fde68a" : "#c8e6c9"}`,
                      padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                    }}>
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* STOCK IN HISTORY */}
      <div className="responsive-table-card" style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Stock In History</h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
            <span style={{ color: "#888", fontSize: "13px" }}>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
            <button onClick={fetchHistory} style={{ padding: "7px 14px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              Filter
            </button>
          </div>
        </div>

        {!historyLoading && history.length > 0 && (
          <div style={{ padding: "12px 20px", background: "#faf9f6", borderBottom: "1px solid #e0ddd5", display: "flex", gap: "24px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Spent: </span>
              <span style={{ fontWeight: "700", color: "#1a1a2e" }}>{formatMoney(totalCostThisPeriod)}</span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Records: </span>
              <span style={{ fontWeight: "700", color: "#1a1a2e" }}>{history.length}</span>
            </div>
          </div>
        )}

        <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Qty Received</th>
              <th style={thStyle}>Cost per Unit</th>
              <th style={thStyle}>Total Cost</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No stock records in this period</td></tr>
            ) : history.map((h, i) => (
              <tr key={i}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.15s" }}
              >
                <td style={{ ...tdStyle, fontWeight: "600" }}>{h.productName}</td>
                <td style={tdStyle}>
                  <span style={{ background: "#f0ede6", color: "#6b6b6b", padding: "2px 8px", borderRadius: "20px", fontSize: "12px" }}>
                    {h.category || "Uncategorized"}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: "600", color: "#2e7d32" }}>+{h.quantity}</td>
                <td style={tdStyle}>{formatMoney(h.costPrice)}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(h.totalCost)}</td>
                <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px" }}>{new Date(h.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
