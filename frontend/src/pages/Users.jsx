import { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaUserPlus } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const USERS_API_URL = `${API_BASE_URL}/users`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const roleBadge = (role) => {
  const styles = {
    sudo_admin: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    admin:      { background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" },
    cashier:    { background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" },
  };
  const s = styles[role] || {};
  const label = role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return (
    <span style={{ ...s, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
      {label}
    </span>
  );
};

export default function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  const fetchUsers = async () => {
    try {
      const res = await fetch(USERS_API_URL, { headers: getAuthHeaders() });
      const data = await res.json();
      setUsers(data);
    } catch {
      setErrorMessage("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    fetch(USERS_API_URL, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (isActive) {
          setUsers(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Failed to load users.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
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

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setRole("cashier"); setEditingId(null);
  };

  const handleSave = async () => {
    if (!name || !email || (!editingId && !password)) {
      setErrorMessage("Name, email and password are required.");
      return;
    }

    try {
      const url = editingId ? `${USERS_API_URL}/${editingId}` : USERS_API_URL;
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { name, email, role, ...(password && { password }) }
        : { name, email, password, role };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save user.");

      setSuccessMessage(editingId ? "User updated successfully." : "User created successfully.");
      resetForm();
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleEdit = (user) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${USERS_API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user.");
      setSuccessMessage("User deleted successfully.");
      await fetchUsers();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Roles available based on current user's role
  const availableRoles = currentUser.role === "sudo_admin"
    ? ["sudo_admin", "admin", "cashier"]
    : ["cashier"];

  return (
    <div className="page-shell users-page" style={pageStyle}>
      <div className="page-header-row" style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Users</h1>
          <p style={subtitleStyle}>Manage staff accounts and access levels.</p>
        </div>
        <button
          onClick={() => { if (showForm && !editingId) { setShowForm(false); resetForm(); return; } resetForm(); setShowForm(true); }}
          style={primaryButtonStyle}
        >
          <FaUserPlus style={{ marginRight: "8px" }} />
          {showForm && !editingId ? "Cancel" : "Add User"}
        </button>
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {/* FORM */}
      {showForm && (
        <div className="panel-card" style={formCardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: "17px", color: "#1a1a2e" }}>
            {editingId ? "Edit User" : "New User"}
          </h3>
          <div className="responsive-form-grid" style={formGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jane@nbb.com" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{editingId ? "New Password (leave blank to keep)" : "Password"}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={handleSave} style={primaryButtonStyle}>
              {editingId ? "Update User" : "Save User"}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={secondaryButtonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="responsive-table-card" style={tableCardStyle}>
        <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
  users
    .filter((user) => {
      // Hide sudo_admin from normal admins
      if (
        currentUser.role !== "sudo_admin" &&
        user.role === "sudo_admin"
      ) {
        return false;
      }

      return true;
    })
    .map((user, index) => (
              <tr
                key={user.id}
                style={{
                  ...tableRowStyle,
                  background: user.id === currentUser.id ? "#faf8f2" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#faf9f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    user.id === currentUser.id ? "#faf8f2" : "transparent";
                }}
              >
                <td style={tdStyle}>{index + 1}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>
                  {user.name} {user.id === currentUser.id && <span style={{ color: "#c9a84c", fontSize: "11px" }}>(you)</span>}
                </td>
                <td style={{ ...tdStyle, color: "#6b6b6b" }}>{user.email}</td>
                <td style={tdStyle}>{roleBadge(user.role)}</td>
                <td style={{ ...tdStyle, color: "#6b6b6b", fontSize: "13px" }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(user)} style={iconButtonStyle} title="Edit user">
                      <FaEdit />
                    </button>
                    {/* Sudo admin can delete everyone except themselves */}
{currentUser.role === "sudo_admin" &&
  user.id !== currentUser.id && (
    <button
      onClick={() => handleDelete(user.id)}
      style={dangerButtonStyle}
      title="Delete user"
    >
      <FaTrash />
    </button>
)}

{/* Admin can only delete cashiers */}
{currentUser.role === "admin" &&
  user.role === "cashier" && (
    <button
      onClick={() => handleDelete(user.id)}
      style={dangerButtonStyle}
      title="Delete user"
    >
      <FaTrash />
    </button>
)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div style={emptyStyle}>Loading users...</div>}
        {!isLoading && users.length === 0 && <div style={emptyStyle}>No users found.</div>}
      </div>
    </div>
  );
}

const pageStyle = { color: "#1a1a2e" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" };
const titleStyle = { fontSize: "30px", margin: "0 0 6px" };
const subtitleStyle = { color: "#6b7280", fontSize: "15px", margin: 0 };
const primaryButtonStyle = { display: "inline-flex", alignItems: "center", padding: "10px 16px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" };
const secondaryButtonStyle = { padding: "10px 16px", background: "#eef1f5", color: "#1a1a2e", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" };
const successStyle = { background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" };
const formCardStyle = { background: "white", border: "1px solid #e0ddd5", borderRadius: "10px", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const formGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
const fieldStyle = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#1a1a2e" };
const inputStyle = { padding: "10px 12px", border: "1px solid #d0cdc6", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#faf9f6" };
const tableCardStyle = { background: "white", border: "1px solid #e0ddd5", borderRadius: "10px", overflow: "hidden" };
const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b6b6b", borderBottom: "2px solid #e0ddd5", background: "#f5f3ee", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "13px 16px", fontSize: "14px", borderBottom: "1px solid #e8e5de" };
const tableRowStyle = { transition: "background 0.15s ease" };
const iconButtonStyle = { background: "#1a1a2e", color: "#c9a84c", border: "none", width: "34px", height: "34px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const dangerButtonStyle = { ...iconButtonStyle, background: "#dc2626", color: "white" };
const emptyStyle = { padding: "40px", textAlign: "center", color: "#888" };
