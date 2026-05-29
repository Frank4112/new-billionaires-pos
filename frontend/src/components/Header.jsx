// import { FaMoon, FaSun } from "react-icons/fa";

function Header({ currentUser, onLogout }) {

  return (
    <div
      className="app-header"
      style={{
        height: "72px",
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 28px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {/* LEFT — Welcome */}
      <div className="app-header-copy">
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1a1a2e" }}>
          Welcome back, {currentUser.name}
        </h3>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
          New Billionaires Bar & Restaurant
        </p>
      </div>

      {/* RIGHT — Logout + Brand together */}
      <div className="app-header-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={onLogout}
          style={{
            padding: "8px 16px",
            background: "#1a1a2e",
            color: "#c9a84c",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          Logout
        </button>

        <div className="app-header-brand" style={brandStyle}>
          <div style={{ ...brandLogoStyle, background: "#111827", borderColor: "#111827", color: "#ffffff" }}>NB</div>
          <div>
            <strong style={{ ...brandNameStyle, color: "#111827" }}>NEW BILLIONAIRES</strong>
            <p style={{ ...brandSubtitleStyle, color: "#111827" }}>BAR & RESTAURANT</p>
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
