import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const MENU_URL = `${API_BASE_URL}/menu`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const formatMoney = (v) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b6b6b", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "13px 14px", fontSize: "14px", borderBottom: "1px solid #e8e5de", color: "#2d2d2d" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #d0cdc6", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#faf9f6", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a1a2e", marginBottom: "6px" };
const iconBtnStyle = { border: "none", borderRadius: "6px", cursor: "pointer", width: "32px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center" };

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch(MENU_URL, { headers: getAuthHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setErrorMessage("Failed to load menu."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let isActive = true;

    fetch(MENU_URL, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (isActive) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Failed to load menu.");
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
  }, []);

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

  const resetForm = () => { setName(""); setPrice(""); setEditingItem(null); };

  const handleSave = async () => {
    if (!name || !price) { setErrorMessage("Name and price are required."); return; }
    try {
      const url = editingItem ? `${MENU_URL}/${editingItem.id}` : MENU_URL;
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: getAuthHeaders(),
        body: JSON.stringify({ name, price: Number(price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(editingItem ? "Item updated!" : "Item added!");
      resetForm(); setShowForm(false);
      await fetchItems();
    } catch (err) { setErrorMessage(err.message); }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from the menu?`)) return;
    try {
      const res = await fetch(`${MENU_URL}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(`"${name}" removed from menu.`);
      await fetchItems();
    } catch (err) { setErrorMessage(err.message); }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-shell menu-page" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1a1a2e" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "700", margin: "0 0 4px" }}>Food Menu</h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Manage food items available at the POS.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); resetForm(); }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 18px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
        >
          <FaPlus /> {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {errorMessage && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{errorMessage}</div>}
      {successMessage && <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>{successMessage}</div>}

      {/* FORM */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
            {editingItem ? `Edit — ${editingItem.name}` : "New Menu Item"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Food Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pilau" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price (KES) *</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} style={{ padding: "10px 20px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              {editingItem ? "Save Changes" : "Add to Menu"}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: "10px 20px", background: "#eef1f5", color: "#1a1a2e", border: "1px solid #d0cdc6", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MENU TABLE */}
      <div style={{ background: "#fff", border: "1px solid #e0ddd5", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
            Menu Items <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "13px" }}>({filteredItems.length})</span>
          </h3>
          <input
            type="text" placeholder="Search menu..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "7px 12px", border: "1px solid #d0cdc6", borderRadius: "7px", fontSize: "13px", outline: "none", width: "200px" }}
          />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888", padding: "40px" }}>Loading menu...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888", padding: "40px" }}>
                {search ? "No items match your search" : "No menu items yet — add your first food item!"}
              </td></tr>
            ) : filteredItems.map((item, i) => (
              <tr key={item.id}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.15s" }}>
                <td style={{ ...tdStyle, color: "#c9a84c", fontWeight: "700" }}>{i + 1}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{item.name}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{formatMoney(item.price)}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => startEdit(item)} style={{ ...iconBtnStyle, background: "#1a1a2e", color: "#c9a84c" }} title="Edit">
                      <FaEdit size={12} />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} style={{ ...iconBtnStyle, background: "#fef2f2", color: "#dc2626" }} title="Delete">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
