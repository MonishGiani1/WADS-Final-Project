import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("gaming");
  const [dateRange, setDateRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(false);

  const [reports, setReports] = useState({
    gaming: [
      {
        id: 1,
        user: "John Doe",
        station: "PC-05",
        game: "Valorant",
        startTime: "14:30",
        endTime: "16:45",
        duration: "2h 15m",
        cost: "Rp 45,000",
        date: "2025-01-22",
        status: "completed"
      },
      {
        id: 2,
        user: "Jane Smith",
        station: "PC-03",
        game: "Counter Strike 2",
        startTime: "13:00",
        endTime: "15:30",
        duration: "2h 30m",
        cost: "Rp 50,000",
        date: "2025-01-22",
        status: "completed"
      },
      {
        id: 3,
        user: "Mike Johnson",
        station: "PC-01",
        game: "League of Legends",
        startTime: "16:00",
        endTime: "ongoing",
        duration: "1h 30m",
        cost: "Rp 30,000",
        date: "2025-01-22",
        status: "active"
      },
      {
        id: 4,
        user: "Sarah Wilson",
        station: "PC-07",
        game: "Fortnite",
        startTime: "12:15",
        endTime: "14:00",
        duration: "1h 45m",
        cost: "Rp 35,000",
        date: "2025-01-22",
        status: "completed"
      }
    ],
    food: [
      {
        id: 101,
        user: "John Doe",
        items: ["Chicken Wings", "Coca Cola"],
        quantity: 2,
        total: "Rp 65,000",
        orderTime: "15:30",
        deliveryTime: "15:45",
        date: "2025-01-22",
        status: "delivered"
      },
      {
        id: 102,
        user: "Alice Brown",
        items: ["Pizza Margherita", "Orange Juice"],
        quantity: 2,
        total: "Rp 85,000",
        orderTime: "14:20",
        deliveryTime: "14:40",
        date: "2025-01-22",
        status: "delivered"
      },
      {
        id: 103,
        user: "Bob Davis",
        items: ["Burger", "Fries", "Pepsi"],
        quantity: 3,
        total: "Rp 75,000",
        orderTime: "16:10",
        deliveryTime: "pending",
        date: "2025-01-22",
        status: "preparing"
      }
    ],
    payments: [
      {
        id: 201,
        user: "John Doe",
        type: "Gaming Time Top-up",
        amount: "Rp 100,000",
        method: "Credit Card",
        time: "13:45",
        date: "2025-01-22",
        status: "successful",
        transactionId: "TXN-001234"
      },
      {
        id: 202,
        user: "Jane Smith",
        type: "Food Order",
        amount: "Rp 65,000",
        method: "QRIS",
        time: "15:30",
        date: "2025-01-22",
        status: "successful",
        transactionId: "TXN-001235"
      },
      {
        id: 203,
        user: "Mike Johnson",
        type: "Gaming Time Top-up",
        amount: "Rp 50,000",
        method: "Credit Card",
        time: "16:00",
        date: "2025-01-22",
        status: "failed",
        transactionId: "TXN-001236"
      }
    ]
  });

  const [stats, setStats] = useState({
    totalRevenue: "Rp 2,450,000",
    activeUsers: 12,
    totalSessions: 45,
    avgSessionTime: "2h 15m"
  });

  const tabs = [
    {
      id: "gaming",
      name: "Gaming Sessions",
      icon: "🎮",
      color: "blue"
    },
    {
      id: "food",
      name: "Food Orders",
      icon: "🍔",
      color: "orange"
    },
    {
      id: "payments",
      name: "Payments",
      icon: "💳",
      color: "green"
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: "📊",
      color: "purple"
    }
  ];

  const dateRanges = [
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "custom", name: "Custom Range" }
  ];

  const getFilteredData = () => {
    if (activeTab === "analytics") return [];
    
    let data = reports[activeTab] || [];
    
    if (searchQuery) {
      data = data.filter(item => 
        item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.game && item.game.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.items && item.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    data = [...data].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "user":
          aVal = a.user;
          bVal = b.user;
          break;
        case "time":
          aVal = a.startTime || a.orderTime || a.time;
          bVal = b.startTime || b.orderTime || b.time;
          break;
        case "amount":
          aVal = parseFloat((a.cost || a.total || a.amount || "0").replace(/[^\d]/g, ''));
          bVal = parseFloat((b.cost || b.total || b.amount || "0").replace(/[^\d]/g, ''));
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return data;
  };

  const handleExport = () => {
    const data = getFilteredData();
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0] || {}).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_reports_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styles = {
    container: {
      width: "100%",
      backgroundColor: "#111827",
      minHeight: "100vh",
      color: "white",
      padding: "2rem"
    },
    header: {
      marginBottom: "2rem"
    },
    title: {
      fontSize: "2.25rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      color: "white"
    },
    subtitle: {
      fontSize: "1rem",
      color: "#9CA3AF",
      marginBottom: "2rem"
    },
    
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem"
    },
    statCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    statValue: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#10B981",
      marginBottom: "0.5rem"
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    
    tabsContainer: {
      display: "flex",
      overflowX: "auto",
      borderBottom: "1px solid #374151",
      marginBottom: "2rem"
    },
    tab: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "1rem 1.5rem",
      cursor: "pointer",
      transition: "all 0.2s",
      borderBottom: "2px solid transparent",
      whiteSpace: "nowrap",
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    tabActive: {
      borderBottomColor: "#10B981",
      color: "#10B981"
    },
    tabInactive: {
      color: "#9CA3AF",
      borderBottomColor: "transparent"
    },
    
    controlsSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      flexWrap: "wrap",
      gap: "1rem"
    },
    leftControls: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    rightControls: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    searchInput: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#1F2937",
      color: "white",
      fontSize: "0.875rem",
      width: "250px"
    },
    select: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#1F2937",
      color: "white",
      fontSize: "0.875rem",
      cursor: "pointer"
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      border: "none",
      backgroundColor: "#10B981",
      color: "white",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    buttonSecondary: {
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },
    
    tableContainer: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      overflow: "hidden",
      border: "1px solid #374151"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    tableHeader: {
      backgroundColor: "#374151"
    },
    th: {
      padding: "1rem",
      textAlign: "left",
      fontWeight: "600",
      fontSize: "0.875rem",
      color: "#D1D5DB",
      borderBottom: "1px solid #4B5563",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    td: {
      padding: "1rem",
      borderBottom: "1px solid #374151",
      fontSize: "0.875rem"
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500"
    },
    statusCompleted: {
      backgroundColor: "#10B981",
      color: "white"
    },
    statusActive: {
      backgroundColor: "#3B82F6",
      color: "white"
    },
    statusPending: {
      backgroundColor: "#F59E0B",
      color: "white"
    },
    statusFailed: {
      backgroundColor: "#EF4444",
      color: "white"
    },
    
    analyticsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem"
    },
    chartCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    chartTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      marginBottom: "1rem",
      color: "white"
    },
    chartPlaceholder: {
      height: "200px",
      backgroundColor: "#374151",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#9CA3AF",
      fontSize: "0.875rem"
    }
  };

  const renderGamingTable = () => (
    <table style={styles.table}>
      <thead style={styles.tableHeader}>
        <tr>
          <th style={styles.th} onClick={() => setSortBy("user")}>User</th>
          <th style={styles.th} onClick={() => setSortBy("station")}>Station</th>
          <th style={styles.th}>Game</th>
          <th style={styles.th} onClick={() => setSortBy("time")}>Time</th>
          <th style={styles.th}>Duration</th>
          <th style={styles.th} onClick={() => setSortBy("amount")}>Cost</th>
          <th style={styles.th}>Status</th>
        </tr>
      </thead>
      <tbody>
        {getFilteredData().map((session) => (
          <tr key={session.id}>
            <td style={styles.td}>{session.user}</td>
            <td style={styles.td}>{session.station}</td>
            <td style={styles.td}>{session.game}</td>
            <td style={styles.td}>{session.startTime} - {session.endTime}</td>
            <td style={styles.td}>{session.duration}</td>
            <td style={styles.td}>{session.cost}</td>
            <td style={styles.td}>
              <span style={{
                ...styles.statusBadge,
                ...(session.status === "completed" ? styles.statusCompleted :
                   session.status === "active" ? styles.statusActive : styles.statusPending)
              }}>
                {session.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderFoodTable = () => (
    <table style={styles.table}>
      <thead style={styles.tableHeader}>
        <tr>
          <th style={styles.th} onClick={() => setSortBy("user")}>User</th>
          <th style={styles.th}>Items</th>
          <th style={styles.th}>Quantity</th>
          <th style={styles.th} onClick={() => setSortBy("time")}>Order Time</th>
          <th style={styles.th}>Delivery</th>
          <th style={styles.th} onClick={() => setSortBy("amount")}>Total</th>
          <th style={styles.th}>Status</th>
        </tr>
      </thead>
      <tbody>
        {getFilteredData().map((order) => (
          <tr key={order.id}>
            <td style={styles.td}>{order.user}</td>
            <td style={styles.td}>{order.items.join(", ")}</td>
            <td style={styles.td}>{order.quantity}</td>
            <td style={styles.td}>{order.orderTime}</td>
            <td style={styles.td}>{order.deliveryTime}</td>
            <td style={styles.td}>{order.total}</td>
            <td style={styles.td}>
              <span style={{
                ...styles.statusBadge,
                ...(order.status === "delivered" ? styles.statusCompleted :
                   order.status === "preparing" ? styles.statusPending : styles.statusActive)
              }}>
                {order.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPaymentsTable = () => (
    <table style={styles.table}>
      <thead style={styles.tableHeader}>
        <tr>
          <th style={styles.th} onClick={() => setSortBy("user")}>User</th>
          <th style={styles.th}>Type</th>
          <th style={styles.th} onClick={() => setSortBy("amount")}>Amount</th>
          <th style={styles.th}>Method</th>
          <th style={styles.th} onClick={() => setSortBy("time")}>Time</th>
          <th style={styles.th}>Transaction ID</th>
          <th style={styles.th}>Status</th>
        </tr>
      </thead>
      <tbody>
        {getFilteredData().map((payment) => (
          <tr key={payment.id}>
            <td style={styles.td}>{payment.user}</td>
            <td style={styles.td}>{payment.type}</td>
            <td style={styles.td}>{payment.amount}</td>
            <td style={styles.td}>{payment.method}</td>
            <td style={styles.td}>{payment.time}</td>
            <td style={styles.td}>{payment.transactionId}</td>
            <td style={styles.td}>
              <span style={{
                ...styles.statusBadge,
                ...(payment.status === "successful" ? styles.statusCompleted : styles.statusFailed)
              }}>
                {payment.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderAnalytics = () => (
    <div style={styles.analyticsContainer}>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Revenue Over Time</h3>
        <div style={styles.chartPlaceholder}>📈 Revenue Chart</div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Popular Games</h3>
        <div style={styles.chartPlaceholder}>🎮 Games Chart</div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>User Activity</h3>
        <div style={styles.chartPlaceholder}>👥 Activity Chart</div>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Peak Hours</h3>
        <div style={styles.chartPlaceholder}>⏰ Hours Chart</div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "gaming":
        return renderGamingTable();
      case "food":
        return renderFoodTable();
      case "payments":
        return renderPaymentsTable();
      case "analytics":
        return renderAnalytics();
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reports & Analytics</h1>
        <p style={styles.subtitle}>
          Comprehensive overview of gaming sessions, orders, and financial data
        </p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalRevenue}</div>
          <div style={styles.statLabel}>Total Revenue Today</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.activeUsers}</div>
          <div style={styles.statLabel}>Active Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalSessions}</div>
          <div style={styles.statLabel}>Total Sessions</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.avgSessionTime}</div>
          <div style={styles.statLabel}>Avg Session Time</div>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </div>
        ))}
      </div>

      <div style={styles.controlsSection}>
        <div style={styles.leftControls}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={styles.select}
          >
            {dateRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.name}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="Search users, games, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.rightControls}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="time">Sort by Time</option>
            <option value="user">Sort by User</option>
            <option value="amount">Sort by Amount</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{...styles.button, ...styles.buttonSecondary}}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          
          <button
            onClick={handleExport}
            style={styles.button}
          >
            Export CSV
          </button>
        </div>
      </div>

      {activeTab !== "analytics" ? (
        <div style={styles.tableContainer}>
          {renderTabContent()}
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
}