import { useState } from "react";

const AUTH_API_URL = "http://localhost:5000/api/auth/login";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(AUTH_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid credentials");
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      onLogin(data.user, data.token);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={pageStyle}>
      <div className="login-brand-panel" style={brandPanelStyle}>
        <div style={brandContentStyle}>
          <div style={logoCircleStyle}>NB</div>
          <h1 style={brandTitleStyle}>NEW BILLIONAIRES</h1>
          <p style={brandSubtitleStyle}>BAR & RESTAURANT</p>
          <div style={dividerStyle} />
          <p style={brandTaglineStyle}>Point of Sale &amp; Inventory Management System</p>
        </div>
      </div>

      <div className="login-form-panel" style={formPanelStyle}>
        <div style={formCardStyle}>
          <h2 style={formTitleStyle}>Welcome back</h2>
          <p style={formSubtitleStyle}>Sign in to your account to continue</p>

          {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.target.style.borderColor = "#d0cdc6")}
                autoComplete="email"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Password</label>
              <div style={passwordWrapStyle}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#d0cdc6")}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ ...submitButtonStyle, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={footerTextStyle}>
            New Billionaires Bar &amp; Restaurant &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

const pageStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" };
const brandPanelStyle = { background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" };
const brandContentStyle = { textAlign: "center", maxWidth: "360px" };
const logoCircleStyle = { width: "90px", height: "90px", borderRadius: "50%", background: "transparent", border: "3px solid #c9a84c", color: "#c9a84c", fontSize: "28px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", letterSpacing: "2px" };
const brandTitleStyle = { color: "#c9a84c", fontSize: "26px", fontWeight: "800", letterSpacing: "3px", margin: "0 0 6px" };
const brandSubtitleStyle = { color: "#8a8a9a", fontSize: "13px", letterSpacing: "4px", margin: "0 0 28px" };
const dividerStyle = { width: "60px", height: "2px", background: "#c9a84c", margin: "0 auto 24px", opacity: 0.5 };
const brandTaglineStyle = { color: "#6a6a7a", fontSize: "14px", lineHeight: "1.7" };
const formPanelStyle = { background: "#f5f3ee", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" };
const formCardStyle = { background: "#ffffff", borderRadius: "14px", border: "1px solid #e0ddd5", padding: "40px", width: "100%", maxWidth: "400px" };
const formTitleStyle = { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 6px" };
const formSubtitleStyle = { color: "#6b6b6b", fontSize: "14px", margin: "0 0 28px" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px", fontSize: "14px" };
const formStyle = { display: "flex", flexDirection: "column", gap: "20px" };
const fieldGroupStyle = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#1a1a2e" };
const inputStyle = { padding: "11px 14px", border: "1px solid #d0cdc6", borderRadius: "8px", fontSize: "14px", color: "#1a1a2e", background: "#faf9f6", outline: "none", transition: "border-color 0.2s", width: "100%", boxSizing: "border-box" };
const passwordWrapStyle = { position: "relative", display: "flex", alignItems: "center" };
const eyeButtonStyle = { position: "absolute", right: "12px", background: "transparent", border: "none", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" };
const submitButtonStyle = { padding: "13px", background: "#1a1a2e", color: "#c9a84c", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", letterSpacing: "0.5px", transition: "opacity 0.2s", marginTop: "4px" };
const footerTextStyle = { textAlign: "center", color: "#aaa", fontSize: "12px", marginTop: "28px", marginBottom: "0" };
