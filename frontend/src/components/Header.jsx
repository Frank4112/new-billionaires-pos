import { FaMoon, FaSun } from "react-icons/fa";

function Header({ currentUser, onLogout, theme, onToggleTheme }) {
  const isDark = theme === "dark";

  return (
    <div
      className="app-header"
      style={{
        height: "72px",
        background: isDark ? "#080a0a" : "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 28px",
        borderBottom: isDark ? "1px solid rgba(212, 164, 50, 0.24)" : "1px solid #e5e7eb",
      }}
    >
      {/* LEFT — Welcome */}
      <div className="app-header-copy">
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: isDark ? "#f8f7ff" : "#1a1a2e" }}>
          Welcome back, {currentUser.name}
        </h3>
        <p style={{ color: isDark ? "#b7aa88" : "#6b7280", fontSize: "14px", marginTop: "4px" }}>
          New Billionaires Bar & Restaurant
        </p>
      </div>

      {/* RIGHT — Logout + Brand together */}
      <div className="app-header-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to light theme" : "Switch to dark gold theme"}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark gold theme"}
          style={{
            width: "42px",
            height: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "#151411" : "#eef1f5",
            color: isDark ? "#f4c85a" : "#1a1a2e",
            border: isDark ? "1px solid #c9a84c" : "1px solid #d0cdc6",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {isDark ? <FaSun /> : <FaMoon />}
        </button>

        <button
          onClick={onLogout}
          style={{
  padding: "8px 16px",
  background: isDark ? "#151411" : "#1a1a2e",
  color: isDark ? "#f4c85a" : "#c9a84c",
  border: isDark ? "1px solid #c9a84c" : "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
}}
         
        >
          Logout
        </button>

        <div className="app-header-brand" style={brandStyle}>
          <div style={{ ...brandLogoStyle, background: isDark ? "#080a0a" : "#111827", borderColor: isDark ? "#c9a84c" : "#111827", color: isDark ? "#f4c85a" : "#ffffff" }}>NB</div>
          <div>
            <strong style={{ ...brandNameStyle, color: isDark ? "#f8f7ff" : "#111827" }}>NEW BILLIONAIRES</strong>
            <p style={{ ...brandSubtitleStyle, color: isDark ? "#b7aa88" : "#111827" }}>BAR & RESTAURANT</p>
          </div>
        </div>

      </div>
    </div>
  );
}

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const brandLogoStyle = {
  width: "36px",
  height: "36px",
  background: "#111827",
  border: "2px solid #111827",
  borderRadius: "50%",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontFamily: "Georgia, serif",
  fontSize: "15px",
};

const brandNameStyle = {
  display: "block",
  color: "#111827",
  fontFamily: "Georgia, serif",
  fontSize: "15px",
  lineHeight: "1",
};

const brandSubtitleStyle = {
  color: "#111827",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1px",
  marginTop: "3px",
};

export default Header;
