import { useEffect, useState } from "react";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";

const PRODUCTS_API_URL = "http://localhost:5000/api/products";
const SALES_API_URL = "http://localhost:5000/api/sales";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

function Sales({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const refreshProducts = async () => {
    const response = await fetch(PRODUCTS_API_URL, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to refresh products");
    const data = await response.json();
    setProducts(data);
  };

  useEffect(() => {
    let isActive = true;

    fetch(PRODUCTS_API_URL, { headers: getAuthHeaders() })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products");
        return response.json();
      })
      .then((data) => { if (isActive) setProducts(data); })
      .catch((error) => { if (isActive) setErrorMessage(error.message); })
      .finally(() => { if (isActive) setIsLoading(false); });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity, 0
  );

  const formatMoney = (amount) => `KES ${Number(amount).toFixed(2)}`;

  const addToCart = (product) => {
    const stock = Number(product.stock);
    setErrorMessage("");
    setSuccessMessage("");

    if (stock <= 0) {
      setErrorMessage(`${product.name} is out of stock`);
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= stock) {
          setErrorMessage(`Only ${stock} ${product.name} in stock`);
          return currentItems;
        }
        return currentItems.map((item) =>
          item.id !== product.id ? item : { ...item, quantity: item.quantity + 1 }
        );
      }
      return [...currentItems, { id: product.id, name: product.name, price: Number(product.price), stock, quantity: 1 }];
    });
  };

  const increaseQuantity = (id) => {
    setErrorMessage("");
    setSuccessMessage("");
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) return item;
        if (item.quantity >= item.stock) {
          setErrorMessage(`Only ${item.stock} ${item.name} in stock`);
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      })
    );
  };

  const decreaseQuantity = (id) => {
    setErrorMessage("");
    setSuccessMessage("");
    setCartItems((currentItems) =>
      currentItems
        .map((item) => item.id !== id ? item : { ...item, quantity: item.quantity - 1 })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setErrorMessage("");
    setSuccessMessage("");
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const completeSale = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("Add at least one product before checkout");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(SALES_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMethod,
          userId: currentUser.id,
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to complete sale");

      setSuccessMessage(`Sale #${data.saleId} completed: ${formatMoney(data.totalAmount)} via ${paymentMethod}`);
      setCartItems([]);
      await refreshProducts();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell sales-page">
      <div className="page-header-row" style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>POS Sales</h1>
          <p style={subtitleStyle}>
            {currentUser.role === "cashier" ? "Cashier checkout workspace" : "Admin checkout workspace"}
          </p>
        </div>
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
      {successMessage && <div style={successStyle}>{successMessage}</div>}

      <div className="responsive-two-column pos-layout" style={layoutStyle}>
        <section className="panel-card" style={productsPanelStyle}>
          <div className="responsive-toolbar" style={panelHeaderStyle}>
            <h3>Products</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={searchInputStyle}
            />
          </div>

          <div style={productListStyle}>
            {isLoading && <div style={emptyPanelStyle}>Loading products...</div>}

            {!isLoading && filteredProducts.map((product) => (
              <div key={product.id} className="pos-product-row" style={productRowStyle}>
                <div>
                  <strong>{product.name}</strong>
                  <p style={productMetaStyle}>
                    {product.category || "Uncategorized"} • Stock {product.stock}
                  </p>
                </div>
                <div style={productActionStyle}>
                  <strong>{formatMoney(product.price)}</strong>
                  <button onClick={() => addToCart(product)} style={addButtonStyle}>Add</button>
                </div>
              </div>
            ))}

            {!isLoading && filteredProducts.length === 0 && (
              <div style={emptyPanelStyle}>No products found.</div>
            )}
          </div>
        </section>

        <aside className="panel-card pos-cart-panel" style={cartPanelStyle}>
          <h3>Current Cart</h3>

          {cartItems.length === 0 && <div style={cartEmptyStyle}>No items added yet.</div>}

          {cartItems.length > 0 && (
            <div style={cartListStyle}>
              {cartItems.map((item) => (
                <div key={item.id} style={cartItemStyle}>
                  <div>
                    <strong>{item.name}</strong>
                    <p style={productMetaStyle}>{formatMoney(item.price)} each</p>
                  </div>
                  <div style={quantityControlsStyle}>
                    <button onClick={() => decreaseQuantity(item.id)} style={quantityButtonStyle}><FaMinus /></button>
                    <span style={quantityValueStyle}>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)} style={quantityButtonStyle}><FaPlus /></button>
                    <button onClick={() => removeFromCart(item.id)} style={removeButtonStyle}><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={totalRowStyle}>
            <span>Total</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </div>

          <div style={paymentGroupStyle}>
            <button onClick={() => setPaymentMethod("cash")} style={paymentMethod === "cash" ? activePaymentButtonStyle : paymentButtonStyle}>Cash</button>
            <button onClick={() => setPaymentMethod("mpesa")} style={paymentMethod === "mpesa" ? activePaymentButtonStyle : paymentButtonStyle}>M-Pesa</button>
          </div>

          <button
            onClick={completeSale}
            style={{ ...checkoutButtonStyle, opacity: cartItems.length === 0 || isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? "Completing..." : "Complete Sale"}
          </button>
        </aside>
      </div>
    </div>
  );
}

const pageHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "20px" };
const titleStyle = { fontSize: "30px", marginBottom: "6px" };
const subtitleStyle = { color: "#6b7280", fontSize: "15px", textTransform: "capitalize" };
const layoutStyle = { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" };
const productsPanelStyle = { background: "white", border: "1px solid #dde3ea", borderRadius: "8px", padding: "20px", minHeight: "420px", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const cartPanelStyle = { background: "white", border: "1px solid #dde3ea", borderRadius: "8px", padding: "20px", minHeight: "420px", boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)" };
const panelHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "20px" };
const searchInputStyle = { width: "260px", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" };
const productListStyle = { display: "grid", gap: "10px" };
const productRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", borderBottom: "1px solid #eef1f5", padding: "13px 0" };
const productMetaStyle = { color: "#6b7280", fontSize: "13px", marginTop: "4px" };
const productActionStyle = { display: "flex", alignItems: "center", gap: "12px" };
const addButtonStyle = { background: "#1f2a36", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", padding: "9px 13px" };
const emptyPanelStyle = { border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "40px", color: "#6b7280", textAlign: "center" };
const cartEmptyStyle = { borderBottom: "1px solid #eef1f5", padding: "34px 0", color: "#6b7280", textAlign: "center" };
const cartListStyle = { display: "grid", gap: "12px", borderBottom: "1px solid #eef1f5", padding: "16px 0" };
const cartItemStyle = { display: "grid", gap: "10px" };
const quantityControlsStyle = { display: "flex", alignItems: "center", gap: "8px" };
const quantityButtonStyle = { width: "31px", height: "31px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" };
const quantityValueStyle = { minWidth: "28px", textAlign: "center", fontWeight: "700" };
const removeButtonStyle = { ...quantityButtonStyle, color: "#dc2626" };
const totalRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", fontSize: "18px" };
const paymentGroupStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" };
const paymentButtonStyle = { padding: "11px", background: "#eef1f5", color: "#1f2a36", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const activePaymentButtonStyle = { ...paymentButtonStyle, background: "#f4c85a", border: "1px solid #d4a432" };
const checkoutButtonStyle = { width: "100%", padding: "12px", background: "#1f2a36", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700" };
const errorStyle = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", padding: "12px 14px", marginBottom: "20px", animation: "fadeOut 4s forwards" };
const successStyle = { background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", padding: "12px 14px", marginBottom: "20px", animation: "fadeOut 4s forwards" };

export default Sales;
