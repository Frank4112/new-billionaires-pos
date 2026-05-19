import { useEffect, useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_URL = "http://localhost:5000/api/products";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

function Products() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setErrorMessage("");

      const response = await fetch(API_URL, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to load products");
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    fetch(API_URL, {
      headers: getHeaders(),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => {
        if (isActive) {
          setProducts(data);
        }
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(error.message);
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

  const resetForm = () => {
    setName("");
    setCategory("");
    setStock("");
    setPrice("");
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    try {
      setErrorMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          category,
          stock,
          price,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to save product");
      }

      await fetchProducts();
      resetForm();
      setShowForm(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditProduct = (product) => {
    setName(product.name);
    setCategory(product.category || "");
    setStock(product.stock);
    setPrice(product.price);

    setEditingId(product.id);

    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      setErrorMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to delete product");
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      setErrorMessage("");

      const response = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          category,
          stock,
          price,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to update product");
      }

      await fetchProducts();
      resetForm();
      setShowForm(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-shell products-page" style={pageStyle}>
      <div className="page-header-row" style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Products</h1>
          <p style={subtitleStyle}>
            Manage inventory items, stock levels, and product pricing.
          </p>
        </div>

      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      <div className="responsive-toolbar" style={toolbarStyle}>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelForm();
              return;
            }

            setShowForm(true);
          }}
          style={primaryButtonStyle}
        >
          {showForm ? "Close Form" : "Add Product"}
        </button>

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {showForm && (
        <div className="panel-card" style={formPanelStyle}>
          <h3 style={sectionTitleStyle}>
            {editingId
              ? "Edit Product"
              : "New Product Form"}
          </h3>

          <div className="responsive-form-grid" style={formGridStyle}>
            <input
              type="text"
              placeholder="Product Name"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Category"
              style={inputStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <input
              type="number"
              placeholder="Stock Quantity"
              style={inputStyle}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />

            <input
              type="number"
              placeholder="Price"
              style={inputStyle}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div style={formActionsStyle}>
            <button
              onClick={
                editingId
                  ? handleUpdateProduct
                  : handleAddProduct
              }
              style={primaryButtonStyle}
            >
              {editingId
                ? "Update Product"
                : "Save Product"}
            </button>

            <button
              onClick={handleCancelForm}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="responsive-table-card" style={tableCardStyle}>
        <table className="responsive-table" style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>ID</th>

              <th style={tableHeaderStyle}>Name</th>

              <th style={tableHeaderStyle}>Category</th>

              <th style={tableHeaderStyle}>Stock</th>

              <th style={tableHeaderStyle}>Price</th>

              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!isLoading && filteredProducts.map((product, index) => (
              <tr
                key={product.id}
                style={tableRowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#faf9f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td style={tableCellStyle}>{index + 1}</td>

                <td style={tableCellStyle}>
                  <strong>{product.name}</strong>
                </td>

                <td style={tableCellStyle}>
                  <span style={categoryBadgeStyle}>
                    {product.category || "Uncategorized"}
                  </span>
                </td>

                <td style={tableCellStyle}>{product.stock}</td>

                <td style={tableCellStyle}>
                  KES {Number(product.price).toFixed(2)}
                </td>

                <td style={tableCellStyle}>
                  <div style={actionGroupStyle}>
                    <button
                      onClick={() =>
                        handleEditProduct(product)
                      }
                      style={iconButtonStyle}
                      title="Edit product"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteProduct(product.id)
                      }
                      style={dangerButtonStyle}
                      title="Delete product"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div style={emptyStateStyle}>Loading products...</div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div style={emptyStateStyle}>
            No products found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  color: "#17202a",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "30px",
  marginBottom: "6px",
};

const subtitleStyle = {
  color: "#6b7280",
  fontSize: "15px",
};

const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "20px",
};

const errorStyle = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: "6px",
  padding: "12px 14px",
  marginBottom: "20px",
};

const primaryButtonStyle = {
  padding: "11px 16px",
  background: "#1f2a36",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const secondaryButtonStyle = {
  padding: "11px 16px",
  background: "#eef1f5",
  color: "#1f2a36",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const searchInputStyle = {
  width: "280px",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  outline: "none",
};

const formPanelStyle = {
  background: "white",
  padding: "22px",
  marginBottom: "20px",
  borderRadius: "8px",
  border: "1px solid #dde3ea",
  boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)",
};

const sectionTitleStyle = {
  marginBottom: "15px",
  fontSize: "18px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const formActionsStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
};

const tableCardStyle = {
  background: "white",
  border: "1px solid #dde3ea",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 10px 24px rgba(31, 42, 54, 0.06)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderStyle = {
  background: "#f8fafc",
  borderBottom: "1px solid #dde3ea",
  color: "#475569",
  fontSize: "13px",
  padding: "13px 14px",
  textAlign: "left",
};

const tableCellStyle = {
  borderBottom: "1px solid #eef1f5",
  padding: "14px",
  textAlign: "left",
  verticalAlign: "middle",
};

const tableRowStyle = {
  transition: "background 0.15s ease",
};

const categoryBadgeStyle = {
  display: "inline-block",
  background: "#edf7f3",
  color: "#0f766e",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "13px",
  fontWeight: "600",
};

const actionGroupStyle = {
  display: "flex",
  gap: "8px",
};

const iconButtonStyle = {
  background: "#1f2a36",
  color: "white",
  border: "none",
  width: "36px",
  height: "34px",
  borderRadius: "6px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const dangerButtonStyle = {
  ...iconButtonStyle,
  background: "#dc2626",
};

const emptyStateStyle = {
  padding: "28px",
  textAlign: "center",
  color: "#6b7280",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  outline: "none",
};

export default Products;
