import { useState, useEffect } from "react";

export default function AdminInventoryManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['snacks', 'meals', 'drinks', 'desserts']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "snacks",
    description: "",
    image: "🍕",
    stock: "",
    isAvailable: true
  });

  const getAdminApiBase = () => {
    try {
      return process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001';
    } catch (error) {
      return 'http://localhost:5001';
    }
  };
  const ADMIN_API_BASE = getAdminApiBase();

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin authentication required. Please login again.');
        return;
      }

      console.log('🔍 Fetching menu items from admin server...');
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/menu-items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setError('Admin session expired. Please login again.');
        localStorage.removeItem('adminToken');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Menu items loaded successfully:', data);
        
        if (data.success && data.menuItems) {
          setMenuItems(data.menuItems);
        } else {
          setError('Invalid response format from server');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to load menu items (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
      setError('Failed to connect to admin server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert("❌ Admin authentication required");
        return;
      }

      console.log('➕ Adding new menu item...');
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (response.status === 401) {
        alert("❌ Admin session expired. Please login again.");
        localStorage.removeItem('adminToken');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Menu item added successfully:', result);
        
        await loadMenuItems();
        setShowAddModal(false);
        resetForm();
        alert('✅ Menu item added successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to add menu item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert('❌ Error adding menu item. Please check your connection.');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert("❌ Admin authentication required");
        return;
      }

      console.log(`📝 Updating menu item ${editingItem._id}...`);
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/menu-items/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (response.status === 401) {
        alert("❌ Admin session expired. Please login again.");
        localStorage.removeItem('adminToken');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Menu item updated successfully:', result);
        
        await loadMenuItems();
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        alert('✅ Menu item updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to update menu item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating item:', error);
      alert('❌ Error updating menu item. Please check your connection.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert("❌ Admin authentication required");
        return;
      }

      console.log(`🗑️ Deleting menu item ${itemId}...`);
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        alert("❌ Admin session expired. Please login again.");
        localStorage.removeItem('adminToken');
        return;
      }

      if (response.ok) {
        console.log('✅ Menu item deleted successfully');
        await loadMenuItems();
        alert('✅ Menu item deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to delete menu item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      alert('❌ Error deleting menu item. Please check your connection.');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description,
      image: item.image,
      stock: item.stock.toString(),
      isAvailable: item.isAvailable
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "snacks",
      description: "",
      image: "🍕",
      stock: "",
      isAvailable: true
    });
  };

  const handleQuickStockUpdate = async (itemId, newStock) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert("❌ Admin authentication required");
        return;
      }

      console.log(`📦 Updating stock for item ${itemId} to ${newStock}...`);
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/menu-items/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: parseInt(newStock) })
      });

      if (response.status === 401) {
        alert("❌ Admin session expired. Please login again.");
        localStorage.removeItem('adminToken');
        return;
      }

      if (response.ok) {
        console.log('✅ Stock updated successfully');
        await loadMenuItems();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to update stock: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      alert('❌ Error updating stock. Please check your connection.');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const emojiOptions = ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🥗', '🍗', '🍖', '🍳', '🥤', '☕', '🧃', '🍦', '🍫', '🍰', '🧀', '🥨', '🍜', '🍲'];

  const styles = {
    container: {
      padding: "2rem",
      backgroundColor: "#111827",
      minHeight: "100vh",
      color: "white"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)"
    },
    title: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "white",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    },
    titleIcon: {
      fontSize: "2rem",
      background: "linear-gradient(135deg, #F87171 0%, #FB923C 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    connectionStatus: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      border: "1px solid #10B981",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      marginBottom: "1rem",
      textAlign: "center"
    },
    connectionText: {
      color: "#10B981",
      fontSize: "0.875rem"
    },
    addButton: {
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.75rem 1.5rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
    },
    controls: {
      display: "flex",
      gap: "1rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
      alignItems: "center"
    },
    searchInput: {
      backgroundColor: "rgba(31, 41, 55, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "0.875rem",
      minWidth: "300px",
      outline: "none",
      transition: "all 0.3s ease"
    },
    categorySelect: {
      backgroundColor: "rgba(31, 41, 55, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "0.875rem",
      outline: "none",
      cursor: "pointer"
    },
    statsCards: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem"
    },
    statCard: {
      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      textAlign: "center"
    },
    statValue: {
      fontSize: "1.75rem",
      fontWeight: "700",
      color: "#3B82F6",
      marginBottom: "0.25rem"
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#D1D5DB"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      flexDirection: "column"
    },
    spinner: {
      width: "40px",
      height: "40px",
      border: "4px solid rgba(16, 185, 129, 0.3)",
      borderTop: "4px solid #10B981",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "1rem"
    },
    errorContainer: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid #EF4444",
      borderRadius: "0.5rem",
      padding: "2rem",
      textAlign: "center"
    },
    errorText: {
      color: "#EF4444",
      fontSize: "1.125rem",
      marginBottom: "1rem"
    },
    tableContainer: {
      backgroundColor: "rgba(31, 41, 55, 0.8)",
      borderRadius: "0.75rem",
      overflow: "hidden",
      border: "1px solid rgba(75, 85, 99, 0.5)"
    },
    tableHeader: {
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)"
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "80px 200px 150px 100px 80px 120px 100px 150px",
      alignItems: "center",
      padding: "1rem",
      borderBottom: "1px solid rgba(75, 85, 99, 0.3)",
      transition: "background-color 0.2s ease"
    },
    tableHeaderRow: {
      fontWeight: "600",
      fontSize: "0.875rem",
      color: "#D1D5DB"
    },
    tableCell: {
      fontSize: "0.875rem",
      color: "white"
    },
    itemImage: {
      fontSize: "2rem",
      textAlign: "center"
    },
    itemName: {
      fontWeight: "600"
    },
    itemCategory: {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
      color: "#93C5FD",
      padding: "0.25rem 0.5rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      textAlign: "center",
      textTransform: "capitalize"
    },
    stockIndicator: {
      padding: "0.25rem 0.5rem",
      borderRadius: "0.375rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      textAlign: "center"
    },
    stockHigh: {
      backgroundColor: "rgba(16, 185, 129, 0.3)",
      color: "#6EE7B7"
    },
    stockMedium: {
      backgroundColor: "rgba(245, 158, 11, 0.3)",
      color: "#FCD34D"
    },
    stockLow: {
      backgroundColor: "rgba(239, 68, 68, 0.3)",
      color: "#FCA5A5"
    },
    stockOut: {
      backgroundColor: "rgba(107, 114, 128, 0.3)",
      color: "#9CA3AF"
    },
    availabilityToggle: {
      position: "relative",
      width: "3rem",
      height: "1.5rem",
      borderRadius: "9999px",
      cursor: "pointer",
      transition: "background-color 0.3s ease"
    },
    toggleSlider: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "20px",
      height: "20px",
      backgroundColor: "white",
      borderRadius: "50%",
      transition: "transform 0.3s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem"
    },
    actionButton: {
      padding: "0.5rem",
      borderRadius: "0.375rem",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    editButton: {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
      color: "#93C5FD"
    },
    deleteButton: {
      backgroundColor: "rgba(239, 68, 68, 0.3)",
      color: "#FCA5A5"
    },
    stockInput: {
      width: "60px",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.375rem",
      padding: "0.25rem 0.5rem",
      color: "white",
      fontSize: "0.75rem",
      textAlign: "center"
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)"
    },
    modalContent: {
      backgroundColor: "#1F2937",
      borderRadius: "0.75rem",
      padding: "2rem",
      width: "90%",
      maxWidth: "500px",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem"
    },
    modalTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "white"
    },
    closeButton: {
      backgroundColor: "transparent",
      border: "none",
      color: "#9CA3AF",
      fontSize: "1.5rem",
      cursor: "pointer",
      padding: "0.25rem"
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    },
    label: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#D1D5DB"
    },
    input: {
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "0.875rem",
      outline: "none",
      transition: "border-color 0.3s ease"
    },
    textarea: {
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "0.875rem",
      outline: "none",
      resize: "vertical",
      minHeight: "80px"
    },
    emojiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(10, 1fr)",
      gap: "0.5rem",
      padding: "0.5rem",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      borderRadius: "0.5rem",
      border: "1px solid rgba(75, 85, 99, 0.5)"
    },
    emojiButton: {
      padding: "0.5rem",
      border: "none",
      backgroundColor: "transparent",
      fontSize: "1.5rem",
      cursor: "pointer",
      borderRadius: "0.375rem",
      transition: "background-color 0.2s ease"
    },
    formActions: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-end",
      marginTop: "1rem"
    },
    submitButton: {
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.75rem 1.5rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease"
    },
    cancelButton: {
      backgroundColor: "rgba(107, 114, 128, 0.3)",
      color: "#D1D5DB",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.75rem 1.5rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease"
    }
  };

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.isAvailable).length;
  const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;
  const outOfStockItems = menuItems.filter(item => item.stock === 0).length;

  const getStockStatus = (stock) => {
    if (stock === 0) return { style: styles.stockOut, text: "Out" };
    if (stock <= 5) return { style: styles.stockLow, text: `${stock} left` };
    if (stock <= 15) return { style: styles.stockMedium, text: `${stock} left` };
    return { style: styles.stockHigh, text: `${stock} left` };
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#9CA3AF" }}>Loading inventory from admin server...</p>
          <p style={{ color: "#6B7280", fontSize: "0.75rem" }}>Connecting to {ADMIN_API_BASE}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={loadMenuItems}
            style={{...styles.submitButton, marginTop: "1rem"}}
          >
            🔄 Retry Connection
          </button>
          <p style={{ color: "#9CA3AF", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            Trying to connect to: {ADMIN_API_BASE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>📦</span>
          Inventory Management
        </h1>
        <button 
          style={styles.addButton}
          onClick={() => setShowAddModal(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#059669";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#10B981";
            e.target.style.transform = "translateY(0)";
          }}
        >
          <span>➕</span>
          Add New Item
        </button>
      </div>

      <div style={styles.connectionStatus}>
        <p style={styles.connectionText}>
          ✅ Connected to Admin Server ({ADMIN_API_BASE})
        </p>
      </div>

      <div style={styles.statsCards}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalItems}</div>
          <div style={styles.statLabel}>Total Items</div>
        </div>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.2) 100%)", border: "1px solid rgba(16, 185, 129, 0.3)"}}>
          <div style={{...styles.statValue, color: "#10B981"}}>{availableItems}</div>
          <div style={styles.statLabel}>Available</div>
        </div>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.2) 100%)", border: "1px solid rgba(245, 158, 11, 0.3)"}}>
          <div style={{...styles.statValue, color: "#F59E0B"}}>{lowStockItems}</div>
          <div style={styles.statLabel}>Low Stock</div>
        </div>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.2) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)"}}>
          <div style={{...styles.statValue, color: "#EF4444"}}>{outOfStockItems}</div>
          <div style={styles.statLabel}>Out of Stock</div>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search items by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => e.target.style.borderColor = "#10B981"}
          onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.categorySelect}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <div style={{...styles.tableRow, ...styles.tableHeaderRow}}>
            <div>Image</div>
            <div>Name</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Status</div>
            <div>Available</div>
            <div>Actions</div>
          </div>
        </div>

        <div>
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item.stock);
            return (
              <div 
                key={item._id} 
                style={styles.tableRow}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(55, 65, 81, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{...styles.tableCell, ...styles.itemImage}}>
                  {item.image}
                </div>
                <div style={{...styles.tableCell, ...styles.itemName}}>
                  {item.name}
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.itemCategory}>
                    {item.category}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {formatPrice(item.price)}
                </div>
                <div style={styles.tableCell}>
                  <input
                    type="number"
                    value={item.stock}
                    onChange={(e) => {
                      const newStock = e.target.value;
                      if (newStock !== item.stock.toString()) {
                        handleQuickStockUpdate(item._id, newStock);
                      }
                    }}
                    style={styles.stockInput}
                    min="0"
                  />
                </div>
                <div style={styles.tableCell}>
                  <span style={{...styles.stockIndicator, ...stockStatus.style}}>
                    {stockStatus.text}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <div
                    style={{
                      ...styles.availabilityToggle,
                      backgroundColor: item.isAvailable ? "#10B981" : "#6B7280"
                    }}
                    onClick={() => {
                      console.log('Toggle availability for item:', item._id);
                    }}
                  >
                    <div
                      style={{
                        ...styles.toggleSlider,
                        transform: item.isAvailable ? "translateX(24px)" : "translateX(0)"
                      }}
                    />
                  </div>
                </div>
                <div style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{...styles.actionButton, ...styles.editButton}}
                      onClick={() => handleEditItem(item)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      style={{...styles.actionButton, ...styles.deleteButton}}
                      onClick={() => handleDeleteItem(item._id)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "rgba(239, 68, 68, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div style={{textAlign: "center", padding: "2rem", color: "#9CA3AF"}}>
            No items match your current filters.
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Menu Item</h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddItem} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  required
                />
              </div>
              <div style={{display: "flex", gap: "1rem"}}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Price (Rp)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={styles.input}
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{...styles.input, cursor: "pointer"}}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Image (Emoji)</label>
                <div style={styles.emojiGrid}>
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      style={{
                        ...styles.emojiButton,
                        backgroundColor: formData.image === emoji ? "rgba(16, 185, 129, 0.3)" : "transparent"
                      }}
                      onClick={() => setFormData({...formData, image: emoji})}
                      onMouseEnter={(e) => {
                        if (formData.image !== emoji) {
                          e.target.style.backgroundColor = "rgba(55, 65, 81, 0.8)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.image !== emoji) {
                          e.target.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    style={{marginRight: "0.5rem"}}
                  />
                  Available for customers
                </label>
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.3)";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#10B981";
                  }}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Menu Item</h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateItem} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  required
                />
              </div>
              <div style={{display: "flex", gap: "1rem"}}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Price (Rp)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={styles.input}
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{...styles.input, cursor: "pointer"}}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Image (Emoji)</label>
                <div style={styles.emojiGrid}>
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      style={{
                        ...styles.emojiButton,
                        backgroundColor: formData.image === emoji ? "rgba(16, 185, 129, 0.3)" : "transparent"
                      }}
                      onClick={() => setFormData({...formData, image: emoji})}
                      onMouseEnter={(e) => {
                        if (formData.image !== emoji) {
                          e.target.style.backgroundColor = "rgba(55, 65, 81, 0.8)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.image !== emoji) {
                          e.target.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    style={{marginRight: "0.5rem"}}
                  />
                  Available for customers
                </label>
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.3)";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#10B981";
                  }}
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}