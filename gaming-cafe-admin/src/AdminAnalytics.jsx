import { useState, useEffect } from "react";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("today");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [isLoading, setIsLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      today: "Rp 2,450,000",
      yesterday: "Rp 2,120,000",
      thisWeek: "Rp 14,500,000",
      thisMonth: "Rp 58,900,000",
      change: "+15.6%"
    },
    users: {
      totalSessions: 247,
      activeUsers: 18,
      newUsers: 12,
      peakHour: "19:00 - 21:00",
      avgSessionTime: "2h 35m"
    },
    games: {
      mostPopular: "Valorant",
      totalGamesPlayed: 189,
      avgGameDuration: "1h 45m",
      peakGameTime: "20:00 - 22:00"
    },
    hardware: {
      stationsActive: 18,
      stationsTotal: 25,
      utilizationRate: "72%",
      maintenanceAlerts: 2
    }
  });

  const [chartData, setChartData] = useState({
    hourlyRevenue: [
      { hour: "08:00", revenue: 125000, users: 3 },
      { hour: "09:00", revenue: 180000, users: 5 },
      { hour: "10:00", revenue: 220000, users: 8 },
      { hour: "11:00", revenue: 285000, users: 12 },
      { hour: "12:00", revenue: 340000, users: 15 },
      { hour: "13:00", revenue: 420000, users: 18 },
      { hour: "14:00", revenue: 395000, users: 16 },
      { hour: "15:00", revenue: 465000, users: 19 },
      { hour: "16:00", revenue: 520000, users: 22 },
      { hour: "17:00", revenue: 580000, users: 25 },
      { hour: "18:00", revenue: 615000, users: 24 },
      { hour: "19:00", revenue: 695000, users: 28 },
      { hour: "20:00", revenue: 725000, users: 30 },
      { hour: "21:00", revenue: 680000, users: 26 },
      { hour: "22:00", revenue: 520000, users: 18 },
      { hour: "23:00", revenue: 285000, users: 10 }
    ],
    popularGames: [
      { name: "Valorant", sessions: 45, revenue: 675000, percentage: 24 },
      { name: "Counter Strike 2", sessions: 38, revenue: 570000, percentage: 20 },
      { name: "League of Legends", sessions: 32, revenue: 480000, percentage: 17 },
      { name: "Fortnite", sessions: 28, revenue: 420000, percentage: 15 },
      { name: "Apex Legends", sessions: 22, revenue: 330000, percentage: 12 },
      { name: "Others", sessions: 35, revenue: 525000, percentage: 12 }
    ],
    weeklyTrends: [
      { day: "Mon", revenue: 1850000, users: 45, sessions: 52 },
      { day: "Tue", revenue: 2120000, users: 52, sessions: 68 },
      { day: "Wed", revenue: 1950000, users: 48, sessions: 55 },
      { day: "Thu", revenue: 2280000, users: 58, sessions: 72 },
      { day: "Fri", revenue: 2650000, users: 65, sessions: 85 },
      { day: "Sat", revenue: 3200000, users: 78, sessions: 95 },
      { day: "Sun", revenue: 2950000, users: 72, sessions: 88 }
    ]
  });

  const dateRanges = [
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "quarter", name: "This Quarter" }
  ];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("📊 Data refreshed successfully!");
    } catch (error) {
      alert("❌ Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData,
      chartData: chartData
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_report_${dateRange}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

    controlsContainer: {
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
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    primaryButton: {
      backgroundColor: "#DC2626",
      color: "white"
    },
    secondaryButton: {
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },

    tabsContainer: {
      display: "flex",
      gap: "0.5rem",
      marginBottom: "2rem"
    },
    tab: {
      padding: "1rem 1.5rem",
      borderRadius: "0.75rem",
      cursor: "pointer",
      transition: "all 0.2s",
      fontSize: "0.875rem",
      fontWeight: "600",
      border: "none"
    },
    tabActive: {
      backgroundColor: "#DC2626",
      color: "white"
    },
    tabInactive: {
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },

    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem"
    },
    kpiCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151",
      position: "relative",
      overflow: "hidden"
    },
    kpiHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem"
    },
    kpiIcon: {
      fontSize: "2rem",
      opacity: "0.8"
    },
    kpiTrend: {
      fontSize: "0.75rem",
      fontWeight: "600",
      padding: "0.25rem 0.5rem",
      borderRadius: "9999px"
    },
    kpiTrendPositive: {
      backgroundColor: "#10B981",
      color: "white"
    },
    kpiTrendNegative: {
      backgroundColor: "#EF4444",
      color: "white"
    },
    kpiValue: {
      fontSize: "2.5rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      color: "white"
    },
    kpiLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF",
      marginBottom: "0.5rem"
    },
    kpiSubtext: {
      fontSize: "0.75rem",
      color: "#6B7280"
    },

    chartsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      gap: "2rem",
      marginBottom: "2rem"
    },
    chartCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    chartHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    chartTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "white"
    },
    chartSubtitle: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    chartPlaceholder: {
      height: "300px",
      backgroundColor: "#374151",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#9CA3AF",
      fontSize: "0.875rem",
      position: "relative",
      overflow: "hidden"
    },
    chartMockData: {
      position: "absolute",
      top: "1rem",
      left: "1rem",
      right: "1rem",
      bottom: "1rem",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    },
    chartMockBars: {
      display: "flex",
      alignItems: "end",
      justifyContent: "space-between",
      height: "200px",
      gap: "0.25rem"
    },
    chartBar: {
      backgroundColor: "#DC2626",
      borderRadius: "2px 2px 0 0",
      flex: 1,
      opacity: 0.8,
      transition: "opacity 0.2s"
    },
    chartBarHover: {
      opacity: 1
    },

    tableContainer: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      overflow: "hidden",
      border: "1px solid #374151",
      marginBottom: "2rem"
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
      borderBottom: "1px solid #4B5563"
    },
    td: {
      padding: "1rem",
      borderBottom: "1px solid #374151",
      fontSize: "0.875rem"
    },

    alertsContainer: {
      display: "grid",
      gap: "1rem",
      marginBottom: "2rem"
    },
    alert: {
      padding: "1rem 1.5rem",
      borderRadius: "0.75rem",
      border: "1px solid",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    },
    alertWarning: {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      borderColor: "#F59E0B",
      color: "#FDE68A"
    },
    alertError: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "#EF4444",
      color: "#FCA5A5"
    },
    alertSuccess: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      borderColor: "#10B981",
      color: "#A7F3D0"
    },

    spinner: {
      width: "20px",
      height: "20px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const renderOverviewTab = () => (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, color: "#10B981"}}>💰</span>
            <span style={{...styles.kpiTrend, ...styles.kpiTrendPositive}}>
              +15.6%
            </span>
          </div>
          <div style={{...styles.kpiValue, color: "#10B981"}}>
            {analyticsData.revenue.today}
          </div>
          <div style={styles.kpiLabel}>Today's Revenue</div>
          <div style={styles.kpiSubtext}>
            Yesterday: {analyticsData.revenue.yesterday}
          </div>
        </div>

        {/* Active Users Card */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, color: "#3B82F6"}}>👥</span>
            <span style={{...styles.kpiTrend, ...styles.kpiTrendPositive}}>
              +8.2%
            </span>
          </div>
          <div style={{...styles.kpiValue, color: "#3B82F6"}}>
            {analyticsData.users.activeUsers}
          </div>
          <div style={styles.kpiLabel}>Active Users</div>
          <div style={styles.kpiSubtext}>
            Peak: {analyticsData.users.peakHour}
          </div>
        </div>

        {/* Station Utilization Card */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, color: "#F59E0B"}}>🖥️</span>
            <span style={{...styles.kpiTrend, ...styles.kpiTrendPositive}}>
              +5.1%
            </span>
          </div>
          <div style={{...styles.kpiValue, color: "#F59E0B"}}>
            {analyticsData.hardware.utilizationRate}
          </div>
          <div style={styles.kpiLabel}>Station Utilization</div>
          <div style={styles.kpiSubtext}>
            {analyticsData.hardware.stationsActive}/{analyticsData.hardware.stationsTotal} stations active
          </div>
        </div>

        {/* Average Session Time Card */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, color: "#8B5CF6"}}>⏱️</span>
            <span style={{...styles.kpiTrend, ...styles.kpiTrendPositive}}>
              +12.3%
            </span>
          </div>
          <div style={{...styles.kpiValue, color: "#8B5CF6"}}>
            {analyticsData.users.avgSessionTime}
          </div>
          <div style={styles.kpiLabel}>Avg Session Time</div>
          <div style={styles.kpiSubtext}>
            {analyticsData.users.totalSessions} total sessions
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div style={styles.alertsContainer}>
        <div style={{...styles.alert, ...styles.alertWarning}}>
          <span>⚠️</span>
          <div>
            <strong>Maintenance Alert:</strong> Station PC-15 requires cleaning - last service 7 days ago
          </div>
        </div>
        
        <div style={{...styles.alert, ...styles.alertError}}>
          <span>🔥</span>
          <div>
            <strong>High Temperature:</strong> Cooling system in Zone A running at 85% capacity
          </div>
        </div>

        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <span>✅</span>
          <div>
            <strong>Peak Performance:</strong> All network systems operating optimally
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        {/* Hourly Revenue Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div>
              <h3 style={styles.chartTitle}>Hourly Revenue</h3>
              <p style={styles.chartSubtitle}>Today's revenue breakdown by hour</p>
            </div>
          </div>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartMockData}>
              <div style={styles.chartMockBars}>
                {chartData.hourlyRevenue.slice(0, 12).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.chartBar,
                      height: `${(item.revenue / 800000) * 180}px`
                    }}
                    title={`${item.hour}: Rp ${item.revenue.toLocaleString()}`}
                  />
                ))}
              </div>
              <div style={{fontSize: "0.75rem", color: "#9CA3AF", textAlign: "center"}}>
                📊 Hourly Revenue Trend
              </div>
            </div>
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div>
              <h3 style={styles.chartTitle}>Popular Games</h3>
              <p style={styles.chartSubtitle}>Most played games today</p>
            </div>
          </div>
          <div style={styles.chartPlaceholder}>
            <div style={{padding: "1rem"}}>
              {chartData.popularGames.slice(0, 5).map((game, index) => (
                <div key={index} style={{marginBottom: "1rem"}}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: "0.25rem"}}>
                    <span style={{fontSize: "0.875rem"}}>{game.name}</span>
                    <span style={{fontSize: "0.875rem", color: "#9CA3AF"}}>{game.percentage}%</span>
                  </div>
                  <div style={{backgroundColor: "#4B5563", borderRadius: "9999px", height: "6px", overflow: "hidden"}}>
                    <div 
                      style={{
                        backgroundColor: "#DC2626",
                        height: "100%",
                        width: `${game.percentage}%`,
                        borderRadius: "9999px"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderRevenueTab = () => (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#10B981"}}>Rp 14.5M</div>
          <div style={styles.kpiLabel}>This Week</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#3B82F6"}}>Rp 58.9M</div>
          <div style={styles.kpiLabel}>This Month</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#F59E0B"}}>Rp 165.2M</div>
          <div style={styles.kpiLabel}>This Quarter</div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Day</th>
              <th style={styles.th}>Revenue</th>
              <th style={styles.th}>Users</th>
              <th style={styles.th}>Sessions</th>
              <th style={styles.th}>Avg per User</th>
            </tr>
          </thead>
          <tbody>
            {chartData.weeklyTrends.map((day, index) => (
              <tr key={index}>
                <td style={styles.td}>{day.day}</td>
                <td style={styles.td}>
                  <span style={{color: "#10B981", fontWeight: "600"}}>
                    Rp {day.revenue.toLocaleString('id-ID')}
                  </span>
                </td>
                <td style={styles.td}>{day.users}</td>
                <td style={styles.td}>{day.sessions}</td>
                <td style={styles.td}>
                  Rp {Math.round(day.revenue / day.users).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderUsersTab = () => (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#3B82F6"}}>247</div>
          <div style={styles.kpiLabel}>Total Users</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#10B981"}}>18</div>
          <div style={styles.kpiLabel}>Active Now</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#F59E0B"}}>12</div>
          <div style={styles.kpiLabel}>New Today</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#8B5CF6"}}>2h 35m</div>
          <div style={styles.kpiLabel}>Avg Session</div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>User Activity Heatmap</h3>
        <div style={styles.chartPlaceholder}>
          📈 User activity patterns and peak hours visualization
        </div>
      </div>
    </>
  );

  const renderSystemTab = () => (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#10B981"}}>99.8%</div>
          <div style={styles.kpiLabel}>System Uptime</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#3B82F6"}}>72%</div>
          <div style={styles.kpiLabel}>Station Utilization</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#F59E0B"}}>2</div>
          <div style={styles.kpiLabel}>Maintenance Alerts</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiValue, color: "#EF4444"}}>0</div>
          <div style={styles.kpiLabel}>Critical Issues</div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>System Performance</h3>
        <div style={styles.chartPlaceholder}>
          🔧 Hardware monitoring, temperature, and performance metrics
        </div>
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics Dashboard</h1>
        <p style={styles.subtitle}>
          Comprehensive business intelligence and system performance metrics
        </p>
      </div>

      <div style={styles.controlsContainer}>
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
        </div>

        <div style={styles.rightControls}>
          <button
            onClick={refreshData}
            disabled={isLoading}
            style={{...styles.button, ...styles.secondaryButton}}
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Data
              </>
            )}
          </button>
          
          <button
            onClick={exportReport}
            style={{...styles.button, ...styles.primaryButton}}
          >
            📊 Export Report
          </button>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        {[
          { id: "overview", name: "📊 Overview" },
          { id: "revenue", name: "💰 Revenue" },
          { id: "users", name: "👥 Users" },
          { id: "system", name: "🔧 System" }
        ].map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "revenue" && renderRevenueTab()}
      {activeTab === "users" && renderUsersTab()}
      {activeTab === "system" && renderSystemTab()}
    </div>
  );
}