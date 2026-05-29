
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import StockManagement from "./pages/StockManagement";
import Menu from "./pages/Menu";
import Login from "./pages/Login";

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

  const isAdmin =
    user.role === "sudo_admin" ||
    user.role === "admin";

  return (
    <BrowserRouter>

      <div
        className="app-shell"
        style={{
          display: "flex",
          height: "100vh",
          background: "#f7f7f4",
        }}
      >

        {/* Sidebar */}
        <Sidebar
          currentUser={user}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div
          className="app-main"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#f7f7f4",
          }}
        >

          {/* Header */}
          <Header
            currentUser={user}
            onLogout={handleLogout}
          />

          {/* Scrollable Page Area */}
          <div
            className="app-content"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
            }}
          >

            <Routes>

              <Route
                path="/"
                element={
                  isCashier
                    ? <Navigate to="/sales" replace />
                    : <Dashboard />
                }
              />

              <Route
                path="/sales"
                element={<Sales currentUser={user} />}
              />

              <Route
                path="/sales-history"
                element={
                  isAdmin
                    ? <SalesHistory currentUser={user} />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/products"
                element={
                  isAdmin
                    ? <Products />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/reports"
                element={
                  isAdmin
                    ? <Reports />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/users"
                element={
                  isAdmin
                    ? <Users currentUser={user} />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/stock"
                element={
                  isAdmin
                    ? <StockManagement />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/menu"
                element={
                  isAdmin
                    ? <Menu />
                    : <Navigate to="/sales" replace />
                }
              />

              <Route
                path="/my-sales"
                element={
                  <SalesHistory
                    currentUser={user}
                    isMySales={true}
                  />
                }
              />

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>

          </div>
        </div>
      </div>

      <Analytics />
      <SpeedInsights />

    </BrowserRouter>
  );
}

export default App;

