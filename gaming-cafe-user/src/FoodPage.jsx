import { useState, useEffect } from "react";
import CheckoutPage from "./CheckoutPage";

export default function FoodPage() {
  // Track active category and cart items with useState hooks
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // 🔥 DATABASE INTEGRATION: Menu items and loading states
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "All" }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 🔥 DATABASE INTEGRATION: Load menu items from database
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/menu-items');
        
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data.menuItems || []);
          
          // Extract unique categories from menu items
          const uniqueCategories = [...new Set(data.menuItems.map(item => item.category))];
          const categoryOptions = [
            { id: "all", name: "All" },
            ...uniqueCategories.map(cat => ({ 
              id: cat.toLowerCase(), 
              name: cat.charAt(0).toUpperCase() + cat.slice(1) 
            }))
          ];
          setCategories(categoryOptions);
        } else {
          // Fallback to default menu items if API fails
          loadFallbackMenu();
        }
      } catch (error) {
        console.error('Error loading menu items:', error);
        setError('Failed to load menu items');
        // Use fallback menu
        loadFallbackMenu();
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // 🔥 FALLBACK MENU: In case database is not available
  const loadFallbackMenu = () => {
    const fallbackMenu = [
      { id: 1, name: "Chicken Wings", price: 45000, category: "snacks", description: "6 pieces of spicy or BBQ wings", image: "🍗", stock: 50, isAvailable: true },
      { id: 2, name: "French Fries", price: 25000, category: "snacks", description: "Crispy fries with dipping sauce", image: "🍟", stock: 30, isAvailable: true },
      { id: 3, name: "Nachos", price: 35000, category: "snacks", description: "Tortilla chips with cheese and salsa", image: "🧀", stock: 25, isAvailable: true },
      { id: 4, name: "Cheeseburger", price: 55000, category: "meals", description: "Beef patty with cheese and veggies", image: "🍔", stock: 20, isAvailable: true },
      { id: 5, name: "Pizza Slice", price: 40000, category: "meals", description: "Large pepperoni pizza slice", image: "🍕", stock: 15, isAvailable: true },
      { id: 6, name: "Chicken Sandwich", price: 50000, category: "meals", description: "Grilled chicken with lettuce and mayo", image: "🥪", stock: 18, isAvailable: true },
      { id: 7, name: "Fried Rice", price: 45000, category: "meals", description: "Indonesian style fried rice", image: "🍚", stock: 22, isAvailable: true },
      { id: 8, name: "Soda", price: 15000, category: "drinks", description: "Various flavors available", image: "🥤", stock: 100, isAvailable: true },
      { id: 9, name: "Coffee", price: 25000, category: "drinks", description: "Hot or iced coffee", image: "☕", stock: 40, isAvailable: true },
      { id: 10, name: "Energy Drink", price: 30000, category: "drinks", description: "Stay energized while gaming", image: "⚡", stock: 35, isAvailable: true },
      { id: 11, name: "Ice Cream", price: 20000, category: "desserts", description: "Chocolate or vanilla", image: "🍦", stock: 25, isAvailable: true },
      { id: 12, name: "Brownie", price: 25000, category: "desserts", description: "Rich chocolate brownie", image: "🍫", stock: 20, isAvailable: true }
    ];
    
    setMenuItems(fallbackMenu);
    
    const fallbackCategories = [
      { id: "all", name: "All" },
      { id: "snacks", name: "Snacks" },
      { id: "meals", name: "Meals" },
      { id: "drinks", name: "Drinks" },
      { id: "desserts", name: "Desserts" }
    ];
    setCategories(fallbackCategories);
  };

  // 🔥 DATABASE INTEGRATION: Update menu item stock after order
  const updateMenuItemStock = async (items) => {
    try {
      await fetch('http://localhost:5000/api/menu-items/update-stock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ orderItems: items })
      });
      
      // Refresh menu items to show updated stock
      const response = await fetch('http://localhost:5000/api/menu-items');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems || []);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };
  
  // Filter menu items based on active category
  const filteredItems = activeCategory === "all" 
    ? menuItems.filter(item => item.isAvailable !== false) // Only show available items
    : menuItems.filter(item => item.category === activeCategory && item.isAvailable !== false);
  
  // Format price to Indonesian Rupiah
  const formatPrice = (price) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };
  
  // 🔥 DATABASE INTEGRATION: Enhanced add to cart with stock checking
  const handleAddToCart = (item) => {
    // Check stock availability
    if (item.stock !== undefined && item.stock <= 0) {
      alert(`Sorry, ${item.name} is out of stock!`);
      return;
    }
    
    // Check if adding one more would exceed stock
    const itemInCart = cart.find(cartItem => cartItem.id === item.id);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
    
    if (item.stock !== undefined && currentQuantityInCart >= item.stock) {
      alert(`Sorry, only ${item.stock} ${item.name} available in stock!`);
      return;
    }
    
    if (itemInCart) {
      // Item exists, update quantity
      const newCart = cart.map(cartItem => {
        if (cartItem.id === item.id) {
          return {...cartItem, quantity: cartItem.quantity + 1};
        }
        return cartItem;
      });
      setCart(newCart);
    } else {
      // Item doesn't exist, add with quantity 1
      setCart([...cart, {...item, quantity: 1}]);
    }
  };
  
  // Remove item from cart
  const handleRemoveFromCart = (itemId) => {
    const itemInCart = cart.find(item => item.id === itemId);
    
    if (itemInCart.quantity === 1) {
      // Only 1 quantity, remove completely
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      // Decrease quantity
      setCart(cart.map(item => {
        if (item.id === itemId) {
          return {...item, quantity: item.quantity - 1};
        }
        return item;
      }));
    }
  };
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Handle checkout initiation
  const handleCheckout = () => {
    if (cart.length > 0) {
      setShowCheckout(true);
    } else {
      alert("Please add items to your order first.");
    }
  };
  
  // 🔥 DATABASE INTEGRATION: Handle checkout completion with stock update
  const handleCheckoutComplete = async () => {
    // Update stock levels in database
    await updateMenuItemStock(cart);
    
    // Clear cart and close checkout
    setCart([]);
    setShowCheckout(false);
    
    // Show success message
    alert("🍕 Order placed successfully! Your food will be delivered to your gaming station.");
  };
  
  // Handle checkout cancellation
  const handleCheckoutCancel = () => {
    setShowCheckout(false);
  };

  // Custom styles with !important to override conflicts
  const styles = {
    container: {
      width: "100%",
      backgroundColor: "#111827",
      minHeight: "100vh",
      paddingBottom: "3rem",
      color: "white"
    },
    innerContainer: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "1.5rem"
    },
    heading: {
      fontSize: "2.25rem",
      fontWeight: "700",
      marginBottom: "2rem",
      textAlign: "center",
      color: "white"
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
    loadingText: {
      color: "#9CA3AF",
      fontSize: "1rem"
    },
    errorContainer: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid #EF4444",
      borderRadius: "0.5rem",
      padding: "1rem",
      marginBottom: "2rem",
      textAlign: "center"
    },
    errorText: {
      color: "#EF4444",
      fontSize: "1rem"
    },
    categoryContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "2rem",
      overflowX: "auto"
    },
    categoryWrapper: {
      display: "flex",
      gap: "1rem"
    },
    categoryButton: {
      padding: "0.5rem 1.5rem",
      borderRadius: "9999px",
      fontSize: "1.125rem",
      fontWeight: "500",
      transition: "all 0.3s",
      cursor: "pointer",
      border: "none"
    },
    mainLayout: {
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    },
    menuSection: {
      width: "100%"
    },
    menuGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "1.5rem"
    },
    menuItem: {
      backgroundColor: "#1F2937",
      borderRadius: "0.75rem",
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      position: "relative"
    },
    outOfStockOverlay: {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: "0.75rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10
    },
    outOfStockText: {
      color: "#EF4444",
      fontWeight: "700",
      fontSize: "1.125rem",
      textAlign: "center"
    },
    menuImageContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "6rem",
      fontSize: "3rem",
      marginBottom: "1rem"
    },
    menuTitle: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "white"
    },
    menuDescription: {
      color: "#9CA3AF",
      fontSize: "0.875rem",
      marginTop: "0.25rem",
      marginBottom: "1rem",
      flexGrow: "1"
    },
    stockInfo: {
      color: "#9CA3AF",
      fontSize: "0.75rem",
      marginBottom: "0.5rem"
    },
    lowStock: {
      color: "#F59E0B"
    },
    priceActionSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    price: {
      color: "#34D399",
      fontWeight: "700"
    },
    addButton: {
      backgroundColor: "#10B981",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      transition: "background-color 0.3s",
      cursor: "pointer",
      border: "none"
    },
    addButtonDisabled: {
      backgroundColor: "#6B7280",
      cursor: "not-allowed"
    },
    cartSection: {
      width: "100%",
      backgroundColor: "#1F2937",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      position: "sticky",
      top: "1.5rem"
    },
    cartTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      color: "white"
    },
    emptyCart: {
      color: "#9CA3AF"
    },
    cartItems: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    },
    cartItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "0.75rem",
      borderBottom: "1px solid #374151"
    },
    cartItemInfo: {
      color: "white"
    },
    cartItemPrice: {
      color: "#9CA3AF",
      fontSize: "0.875rem"
    },
    cartControls: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    },
    cartButton: {
      color: "#9CA3AF",
      backgroundColor: "#374151",
      width: "2rem",
      height: "2rem",
      borderRadius: "9999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: "pointer"
    },
    cartItemQuantity: {
      color: "white"
    },
    totalSection: {
      borderTop: "1px solid #374151",
      paddingTop: "1rem",
      marginTop: "1rem"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "1.125rem",
      fontWeight: "700"
    },
    totalLabel: {
      color: "white"
    },
    totalAmount: {
      color: "#34D399"
    },
    orderButton: {
      width: "100%",
      backgroundColor: "#10B981",
      color: "white",
      padding: "0.75rem",
      borderRadius: "0.5rem",
      marginTop: "1rem",
      fontWeight: "500",
      transition: "background-color 0.3s",
      border: "none",
      cursor: "pointer"
    }
  };

  // Media query for responsive layout
  const getLayoutStyle = () => {
    return windowWidth >= 1024 
      ? { 
          display: "flex", 
          flexDirection: "row", 
          gap: "2rem" 
        } 
      : styles.mainLayout;
  };

  // 🔥 HELPER FUNCTION: Check if item is low stock
  const isLowStock = (stock) => {
    return stock !== undefined && stock > 0 && stock <= 5;
  };

  // 🔥 HELPER FUNCTION: Check if item is out of stock
  const isOutOfStock = (item) => {
    return item.stock !== undefined && item.stock <= 0;
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <h1 style={styles.heading}>Food & Drinks</h1>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <h1 style={styles.heading}>Food & Drinks</h1>
        
        {/* Error message */}
        {error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        
        {/* Category selector */}
        <div style={styles.categoryContainer}>
          <div style={styles.categoryWrapper}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  ...styles.categoryButton,
                  backgroundColor: activeCategory === category.id ? "#10B981" : "#374151",
                  color: activeCategory === category.id ? "white" : "#D1D5DB"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main layout - menu + cart */}
        <div style={getLayoutStyle()}>
          {/* Menu items */}
          <div style={windowWidth >= 1024 ? { width: "66.666667%" } : styles.menuSection}>
            <div style={styles.menuGrid}>
              {filteredItems.map((item) => (
                <div key={item.id} style={styles.menuItem}>
                  {/* 🔥 OUT OF STOCK OVERLAY */}
                  {isOutOfStock(item) && (
                    <div style={styles.outOfStockOverlay}>
                      <div style={styles.outOfStockText}>
                        OUT OF<br/>STOCK
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.menuImageContainer}>
                    {item.image}
                  </div>
                  <h3 style={styles.menuTitle}>{item.name}</h3>
                  <p style={styles.menuDescription}>{item.description}</p>
                  
                  {/* 🔥 STOCK INFORMATION */}
                  {item.stock !== undefined && (
                    <p style={{
                      ...styles.stockInfo,
                      ...(isLowStock(item.stock) ? styles.lowStock : {})
                    }}>
                      {isLowStock(item.stock) 
                        ? `⚠️ Only ${item.stock} left!` 
                        : `${item.stock} in stock`
                      }
                    </p>
                  )}
                  
                  <div style={styles.priceActionSection}>
                    <span style={styles.price}>{formatPrice(item.price)}</span>
                    <button 
                      onClick={() => handleAddToCart(item)}
                      disabled={isOutOfStock(item)}
                      style={{
                        ...styles.addButton,
                        ...(isOutOfStock(item) ? styles.addButtonDisabled : {})
                      }}
                    >
                      {isOutOfStock(item) ? "Out of Stock" : "Add to Order"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Cart */}
          <div style={windowWidth >= 1024 ? { width: "33.333333%" } : { width: "100%" }}>
            <div style={styles.cartSection}>
              <h2 style={styles.cartTitle}>Your Order</h2>
              
              {cart.length === 0 ? (
                <p style={styles.emptyCart}>Your cart is empty</p>
              ) : (
                <div style={styles.cartItems}>
                  {cart.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                      <div>
                        <h3 style={styles.cartItemInfo}>{item.name}</h3>
                        <p style={styles.cartItemPrice}>{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <div style={styles.cartControls}>
                        <button 
                          onClick={() => handleRemoveFromCart(item.id)}
                          style={styles.cartButton}
                        >
                          -
                        </button>
                        <span style={styles.cartItemQuantity}>{item.quantity}</span>
                        <button 
                          onClick={() => handleAddToCart(item)}
                          style={styles.cartButton}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div style={styles.totalSection}>
                    <div style={styles.totalRow}>
                      <span style={styles.totalLabel}>Total:</span>
                      <span style={styles.totalAmount}>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    style={styles.orderButton}
                  >
                    Place Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 DATABASE INTEGRATION: Enhanced Checkout */}
        {showCheckout && (
          <CheckoutPage
            items={cart}
            totalAmount={cartTotal}
            onCancel={handleCheckoutCancel}
            onComplete={handleCheckoutComplete}
            checkoutType="food"
          />
        )}

        {/* CSS for animations */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}