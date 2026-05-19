import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import SalesHistory from "./pages/SalesHistory";
import Login from "./pages/Login";
import Users from "./pages/Users";
import StockManagement from "./pages/StockManagement";

function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (loggedInUser, token) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isCashier = user.role === "cashier";
  const isAdmin = user.role === "sudo_admin" || user.role === "admin";

  return (
    <BrowserRouter>
      {/* Full viewport, nothing overflows at root level */}
      <div
        className="app-shell"
        style={{ display: "flex", height: "100vh", overflow: "hidden" }}
      >

        {/* Sidebar — fixed height, does not scroll with content */}
        <Sidebar currentUser={user} onLogout={handleLogout} />

        {/* Right side — column layout, fills remaining space */}
        <div
          className="app-main"
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f7f7f4" }}
        >

          {/* Header — always visible at top */}
          <Header currentUser={user} onLogout={handleLogout} />

          {/* Content — only this area scrolls */}
          <div
            className="app-content"
            style={{ flex: 1, overflowY: "auto", padding: "24px" }}
          >
            <Routes>
              <Route
                path="/"
                element={isCashier ? <Navigate to="/sales" replace /> : <Dashboard />}
              />
              <Route path="/sales" element={<Sales currentUser={user} />} />
              <Route
                path="/sales-history"
                element={isAdmin ? <SalesHistory currentUser={user} /> : <Navigate to="/sales" replace />}
              />
              <Route
                path="/products"
                element={isAdmin ? <Products /> : <Navigate to="/sales" replace />}
              />
              <Route
                path="/reports"
                element={isAdmin ? <Reports /> : <Navigate to="/sales" replace />}
              />
              <Route
                path="/users"
                element={isAdmin ? <Users currentUser={user} /> : <Navigate to="/sales" replace />}
              />
              <Route
                path="/stock"
                element={isAdmin ? <StockManagement /> : <Navigate to="/sales" replace />}
              />
              <Route
                path="/my-sales"
                element={<SalesHistory currentUser={user} isMySales={true} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

        </div>
      </div>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
