import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import {
  FaBox,
  FaChartBar,
  FaCashRegister,
  FaTachometerAlt,
  FaUserCircle,
  FaWarehouse,
  FaHistory,
} from "react-icons/fa";
import logo from "../assets/logo.png";

function Sidebar({ currentUser }) {
  const adminMenuItems = [
    { name: "Dashboard",       path: "/",             icon: <FaTachometerAlt /> },
    { name: "POS / New Sale",  path: "/sales",        icon: <FaCashRegister /> },
    { name: "Sales History",   path: "/sales-history",icon: <FaHistory /> },
    { name: "Products",        path: "/products",     icon: <FaBox /> },
    { name: "Stock",           path: "/stock",        icon: <FaWarehouse /> },
    { name: "User Management", path: "/users",        icon: <FaUserCircle /> },
    { name: "Reports",         path: "/reports",      icon: <FaChartBar /> },
  ];

  const cashierMenuItems = [
    { name: "POS / New Sale", path: "/sales",    icon: <FaCashRegister /> },
    { name: "My Sales",       path: "/my-sales", icon: <FaHistory /> },
  ];

  const menuItems =
    currentUser.role === "sudo_admin" || currentUser.role === "admin"
      ? adminMenuItems
      : cashierMenuItems;

  const formatRole = (role) =>
    role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <img src={logo} alt="New Billionaires logo" className="sidebar-logo" />
          <h2>New Billionaires</h2>
          <p>Bar & Restaurant</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-user">
        <FaUserCircle className="sidebar-user-icon" />
        <div>
          <strong>{currentUser.name}</strong>
          <p>{formatRole(currentUser.role)}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;