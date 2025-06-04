import { useState, useEffect } from "react";

export default function AdminSystemControl() {
  const [activeTab, setActiveTab] = useState("stations");
  const [selectedStation, setSelectedStation] = useState(null);
  const [systemStats, setSystemStats] = useState({
    uptime: "99.8%",
    totalStations: 25,
    activeStations: 18,
    maintenanceRequired: 3,
    networkStatus: "optimal"
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mock stations data
  const [stations, setStations] = useState([
    {
      id: "PC-01",
      status: "active",
      user: "John Doe",
      game: "Valorant",
      sessionTime: "2h 15m",
      cpu: 45,
      gpu: 52,
      ram: 67,
      temp: 42,
      lastMaintenance: "2025-01-15",
      specs: {
        cpu: "Intel i7-12700K",
        gpu: "RTX 4080",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD"
      },
      issues: []
    },
    {
      id: "PC-02",
      status: "active",
      user: "Jane Smith",
      game: "Counter Strike 2",
      sessionTime: "1h 30m",
      cpu: 38,
      gpu: 41,
      ram: 55,
      temp: 39,
      lastMaintenance: "2025-01-18",
      specs: {
        cpu: "Intel i7-12700K",
        gpu: "RTX 4080",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD"
      },
      issues: []
    },
    {
      id: "PC-03",
      status: "maintenance",
      user: null,
      game: null,
      sessionTime: null,
      cpu: 0,
      gpu: 0,
      ram: 15,
      temp: 28,
      lastMaintenance: "2025-01-08",
      specs: {
        cpu: "Intel i7-12700K",
        gpu: "RTX 4080",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD"
      },
      issues: ["Keyboard replacement needed", "Mouse not responsive"]
    },
    {
      id: "PC-04",
      status: "available",
      user: null,
      game: null,
      sessionTime: null,
      cpu: 5,
      gpu: 8,
      ram: 22,
      temp: 32,
      lastMaintenance: "2025-01-20",
      specs: {
        cpu: "Intel i7-12700K",
        gpu: "RTX 4080",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD"
      },
      issues: []
    },
    {
      id: "PC-05",
      status: "warning",
      user: "Mike Johnson",
      game: "League of Legends",
      sessionTime: "3h 45m",
      cpu: 78,
      gpu: 85,
      ram: 89,
      temp: 67,
      lastMaintenance: "2025-01-10",
      specs: {
        cpu: "Intel i7-12700K",
        gpu: "RTX 4080",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD"
      },
      issues: ["High temperature warning", "RAM usage critical"]
    }
  ]);

  // Mock network data
  const [networkData, setNetworkData] = useState({
    internetSpeed: "950 Mbps",
    latency: "12ms",
    packetLoss: "0.1%",
    connectedDevices: 23,
    bandwidthUsage: 67,
    status: "optimal"
  });

  // Mock maintenance schedule
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([
    {
      id: "MAINT-001",
      station: "PC-03",
      type: "Hardware Replacement",
      priority: "high",
      scheduledDate: "2025-01-23",
      estimatedTime: "2 hours",
      technician: "Tech Team A",
      description: "Replace faulty keyboard and mouse"
    },
    {
      id: "MAINT-002",
      station: "PC-15",
      type: "Routine Cleaning",
      priority: "medium",
      scheduledDate: "2025-01-24",
      estimatedTime: "30 minutes",
      technician: "Tech Team B",
      description: "Deep clean system and replace thermal paste"
    },
    {
      id: "MAINT-003",
      station: "All Stations",
      type: "Software Update",
      priority: "low",
      scheduledDate: "2025-01-25",
      estimatedTime: "4 hours",
      technician: "IT Team",
      description: "Install Windows updates and game client updates"
    }
  ]);

  // Handle station actions
  const handleStationAction = async (stationId, action) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (action) {
        case "restart":
          setStations(prev => prev.map(station => 
            station.id === stationId 
              ? { ...station, status: "available", user: null, game: null, sessionTime: null }
              : station
          ));
          alert(`✅ Station ${stationId} restarted successfully`);
          break;
          
        case "shutdown":
          setStations(prev => prev.map(station => 
            station.id === stationId 
              ? { ...station, status: "offline", user: null, game: null, sessionTime: null }
              : station
          ));
          alert(`🔌 Station ${stationId} shut down successfully`);
          break;
          
        case "maintenance":
          setStations(prev => prev.map(station => 
            station.id === stationId 
              ? { ...station, status: "maintenance", user: null, game: null, sessionTime: null }
              : station
          ));
          alert(`🔧 Station ${stationId} set to maintenance mode`);
          break;
          
        case "activate":
          setStations(prev => prev.map(station => 
            station.id === stationId 
              ? { ...station, status: "available" }
              : station
          ));
          alert(`✅ Station ${stationId} activated successfully`);
          break;
      }
      
    } catch (error) {
      alert("❌ Action failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle network operations
  const handleNetworkAction = async (action) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      switch (action) {
        case "speedtest":
          alert("🌐 Network speed test completed: Download 950Mbps, Upload 850Mbps, Latency 12ms");
          break;
        case "restart":
          alert("🔄 Network equipment restarted successfully");
          break;
        case "optimize":
          alert("⚡ Network optimization completed - bandwidth allocation updated");
          break;
      }
      
    } catch (error) {
      alert("❌ Network action failed");
    } finally {
      setIsLoading(false);
    }
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

    // System Stats Cards
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
      border: "1px solid #374151",
      textAlign: "center",
      position: "relative"
    },
    statValue: {
      fontSize: "2rem",
      fontWeight: "700",
      marginBottom: "0.5rem"
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    statIcon: {
      position: "absolute",
      top: "1rem",
      right: "1rem",
      fontSize: "1.5rem",
      opacity: "0.6"
    },

    // Tabs
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

    // Stations Grid
    stationsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem"
    },
    stationCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s"
    },
    stationCardHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)"
    },
    stationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    stationId: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "white"
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      textTransform: "uppercase"
    },
    stationInfo: {
      marginBottom: "1rem"
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "0.5rem",
      fontSize: "0.875rem"
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.75rem",
      marginBottom: "1rem"
    },
    metricItem: {
      backgroundColor: "#374151",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      textAlign: "center"
    },
    metricLabel: {
      fontSize: "0.75rem",
      color: "#9CA3AF",
      marginBottom: "0.25rem"
    },
    metricValue: {
      fontSize: "1rem",
      fontWeight: "600"
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap"
    },
    actionButton: {
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "none",
      fontSize: "0.75rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      flex: 1,
      minWidth: "80px"
    },

    // Network Section
    networkContainer: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "2rem"
    },
    networkStats: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    networkActions: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      marginBottom: "1rem",
      color: "white"
    },
    networkMetric: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid #374151"
    },
    networkLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    networkValue: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "white"
    },

    // Maintenance Table
    maintenanceContainer: {
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
      borderBottom: "1px solid #4B5563"
    },
    td: {
      padding: "1rem",
      borderBottom: "1px solid #374151",
      fontSize: "0.875rem"
    },
    priorityBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      textTransform: "uppercase"
    },

    // Station Detail Modal
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      border: "1px solid #374151"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #374151"
    },
    modalTitle: {
      fontSize: "1.5rem",
      fontWeight: "700"
    },
    closeButton: {
      backgroundColor: "transparent",
      border: "none",
      fontSize: "1.5rem",
      color: "#9CA3AF",
      cursor: "pointer"
    },
    specsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
      marginBottom: "1.5rem"
    },
    specItem: {
      backgroundColor: "#374151",
      padding: "0.75rem",
      borderRadius: "0.5rem"
    },
    specLabel: {
      fontSize: "0.75rem",
      color: "#9CA3AF",
      marginBottom: "0.25rem"
    },
    specValue: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "white"
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
    successButton: {
      backgroundColor: "#16A34A",
      color: "white"
    },
    warningButton: {
      backgroundColor: "#D97706",
      color: "white"
    },
    dangerButton: {
      backgroundColor: "#EF4444",
      color: "white"
    },

    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }
  };

  // Add CSS animation
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case "active": return "#10B981";
      case "available": return "#3B82F6";
      case "maintenance": return "#F59E0B";
      case "warning": return "#EF4444";
      case "offline": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getMetricColor = (value, type) => {
    if (type === "temp") {
      if (value > 60) return "#EF4444";
      if (value > 45) return "#F59E0B";
      return "#10B981";
    }
    
    if (value > 80) return "#EF4444";
    if (value > 60) return "#F59E0B";
    return "#10B981";
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#6B7280";
    }
  };

  const renderStationsTab = () => (
    <>
      {/* System Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: "#10B981"}}>🖥️</div>
          <div style={{...styles.statValue, color: "#10B981"}}>{systemStats.activeStations}</div>
          <div style={styles.statLabel}>Active Stations</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: "#3B82F6"}}>💻</div>
          <div style={{...styles.statValue, color: "#3B82F6"}}>{systemStats.totalStations}</div>
          <div style={styles.statLabel}>Total Stations</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: "#F59E0B"}}>🔧</div>
          <div style={{...styles.statValue, color: "#F59E0B"}}>{systemStats.maintenanceRequired}</div>
          <div style={styles.statLabel}>Need Maintenance</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: "#10B981"}}>⚡</div>
          <div style={{...styles.statValue, color: "#10B981"}}>{systemStats.uptime}</div>
          <div style={styles.statLabel}>System Uptime</div>
        </div>
      </div>

      {/* Stations Grid */}
      <div style={styles.stationsGrid}>
        {stations.map((station) => (
          <div
            key={station.id}
            style={styles.stationCard}
            onClick={() => setSelectedStation(station)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={styles.stationHeader}>
              <h3 style={styles.stationId}>{station.id}</h3>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(station.status),
                color: "white"
              }}>
                {station.status}
              </span>
            </div>

            <div style={styles.stationInfo}>
              {station.user && (
                <>
                  <div style={styles.infoRow}>
                    <span style={{color: "#9CA3AF"}}>User:</span>
                    <span>{station.user}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{color: "#9CA3AF"}}>Game:</span>
                    <span>{station.game}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{color: "#9CA3AF"}}>Session:</span>
                    <span>{station.sessionTime}</span>
                  </div>
                </>
              )}
              
              {station.issues.length > 0 && (
                <div style={{color: "#EF4444", fontSize: "0.875rem", marginTop: "0.5rem"}}>
                  ⚠️ {station.issues.length} issue(s) reported
                </div>
              )}
            </div>

            <div style={styles.metricsGrid}>
              <div style={styles.metricItem}>
                <div style={styles.metricLabel}>CPU</div>
                <div style={{
                  ...styles.metricValue,
                  color: getMetricColor(station.cpu, "cpu")
                }}>
                  {station.cpu}%
                </div>
              </div>
              <div style={styles.metricItem}>
                <div style={styles.metricLabel}>GPU</div>
                <div style={{
                  ...styles.metricValue,
                  color: getMetricColor(station.gpu, "gpu")
                }}>
                  {station.gpu}%
                </div>
              </div>
              <div style={styles.metricItem}>
                <div style={styles.metricLabel}>RAM</div>
                <div style={{
                  ...styles.metricValue,
                  color: getMetricColor(station.ram, "ram")
                }}>
                  {station.ram}%
                </div>
              </div>
              <div style={styles.metricItem}>
                <div style={styles.metricLabel}>TEMP</div>
                <div style={{
                  ...styles.metricValue,
                  color: getMetricColor(station.temp, "temp")
                }}>
                  {station.temp}°C
                </div>
              </div>
            </div>

            <div style={styles.actionButtons}>
              {station.status === "active" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationAction(station.id, "restart");
                    }}
                    style={{...styles.actionButton, backgroundColor: "#F59E0B", color: "white"}}
                  >
                    🔄 Restart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationAction(station.id, "maintenance");
                    }}
                    style={{...styles.actionButton, backgroundColor: "#6B7280", color: "white"}}
                  >
                    🔧 Maintenance
                  </button>
                </>
              )}
              
              {station.status === "available" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStationAction(station.id, "shutdown");
                  }}
                  style={{...styles.actionButton, backgroundColor: "#EF4444", color: "white"}}
                >
                  🔌 Shutdown
                </button>
              )}
              
              {(station.status === "maintenance" || station.status === "offline") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStationAction(station.id, "activate");
                  }}
                  style={{...styles.actionButton, backgroundColor: "#10B981", color: "white"}}
                >
                  ✅ Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderNetworkTab = () => (
    <div style={styles.networkContainer}>
      <div style={styles.networkStats}>
        <h3 style={styles.sectionTitle}>Network Performance</h3>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Internet Speed</span>
          <span style={{...styles.networkValue, color: "#10B981"}}>{networkData.internetSpeed}</span>
        </div>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Latency</span>
          <span style={{...styles.networkValue, color: "#10B981"}}>{networkData.latency}</span>
        </div>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Packet Loss</span>
          <span style={{...styles.networkValue, color: "#10B981"}}>{networkData.packetLoss}</span>
        </div>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Connected Devices</span>
          <span style={styles.networkValue}>{networkData.connectedDevices}</span>
        </div>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Bandwidth Usage</span>
          <span style={{
            ...styles.networkValue,
            color: networkData.bandwidthUsage > 80 ? "#EF4444" : "#10B981"
          }}>
            {networkData.bandwidthUsage}%
          </span>
        </div>
        
        <div style={styles.networkMetric}>
          <span style={styles.networkLabel}>Status</span>
          <span style={{...styles.networkValue, color: "#10B981"}}>
            {networkData.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={styles.networkActions}>
        <h3 style={styles.sectionTitle}>Network Actions</h3>
        
        <div style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
          <button
            onClick={() => handleNetworkAction("speedtest")}
            disabled={isLoading}
            style={{...styles.button, ...styles.primaryButton}}
          >
            {isLoading ? <div style={styles.spinner}></div> : "🌐"} Speed Test
          </button>
          
          <button
            onClick={() => handleNetworkAction("restart")}
            disabled={isLoading}
            style={{...styles.button, ...styles.warningButton}}
          >
            {isLoading ? <div style={styles.spinner}></div> : "🔄"} Restart Equipment
          </button>
          
          <button
            onClick={() => handleNetworkAction("optimize")}
            disabled={isLoading}
            style={{...styles.button, ...styles.successButton}}
          >
            {isLoading ? <div style={styles.spinner}></div> : "⚡"} Optimize Network
          </button>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div style={styles.maintenanceContainer}>
      <div style={{padding: "1.5rem", borderBottom: "1px solid #374151"}}>
        <h3 style={styles.sectionTitle}>Maintenance Schedule</h3>
      </div>
      
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Station</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Scheduled Date</th>
            <th style={styles.th}>Technician</th>
            <th style={styles.th}>Est. Time</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {maintenanceSchedule.map((maintenance) => (
            <tr key={maintenance.id}>
              <td style={styles.td}>
                <span style={{fontWeight: "600"}}>{maintenance.station}</span>
              </td>
              <td style={styles.td}>{maintenance.type}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.priorityBadge,
                  backgroundColor: getPriorityColor(maintenance.priority),
                  color: "white"
                }}>
                  {maintenance.priority}
                </span>
              </td>
              <td style={styles.td}>{maintenance.scheduledDate}</td>
              <td style={styles.td}>{maintenance.technician}</td>
              <td style={styles.td}>{maintenance.estimatedTime}</td>
              <td style={styles.td}>
                <div style={{display: "flex", gap: "0.5rem"}}>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#10B981",
                      color: "white"
                    }}
                  >
                    ✅ Complete
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#F59E0B",
                      color: "white"
                    }}
                  >
                    📅 Reschedule
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>System Control Center</h1>
        <p style={styles.subtitle}>
          Hardware monitoring, maintenance tools, and system configuration
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: "stations", name: "🖥️ Stations" },
          { id: "network", name: "🌐 Network" },
          { id: "maintenance", name: "🔧 Maintenance" }
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

      {/* Tab Content */}
      {activeTab === "stations" && renderStationsTab()}
      {activeTab === "network" && renderNetworkTab()}
      {activeTab === "maintenance" && renderMaintenanceTab()}

      {/* Station Detail Modal */}
      {selectedStation && (
        <div style={styles.modal} onClick={() => setSelectedStation(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Station {selectedStation.id} Details</h2>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedStation(null)}
              >
                ✕
              </button>
            </div>
            
            {/* Station Status */}
            <div style={{marginBottom: "1.5rem"}}>
              <div style={{display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem"}}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(selectedStation.status),
                  color: "white"
                }}>
                  {selectedStation.status.toUpperCase()}
                </span>
                {selectedStation.user && (
                  <span style={{color: "#9CA3AF"}}>
                    Currently used by: <strong style={{color: "white"}}>{selectedStation.user}</strong>
                  </span>
                )}
              </div>
              
              {selectedStation.game && (
                <div style={{marginBottom: "1rem"}}>
                  <span style={{color: "#9CA3AF"}}>Playing: </span>
                  <strong style={{color: "#10B981"}}>{selectedStation.game}</strong>
                  <span style={{color: "#9CA3AF"}}> for {selectedStation.sessionTime}</span>
                </div>
              )}
            </div>

            {/* Hardware Specifications */}
            <div style={{marginBottom: "1.5rem"}}>
              <h4 style={{fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem"}}>
                Hardware Specifications
              </h4>
              <div style={styles.specsGrid}>
                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Processor</div>
                  <div style={styles.specValue}>{selectedStation.specs.cpu}</div>
                </div>
                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Graphics Card</div>
                  <div style={styles.specValue}>{selectedStation.specs.gpu}</div>
                </div>
                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Memory</div>
                  <div style={styles.specValue}>{selectedStation.specs.ram}</div>
                </div>
                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Storage</div>
                  <div style={styles.specValue}>{selectedStation.specs.storage}</div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div style={{marginBottom: "1.5rem"}}>
              <h4 style={{fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem"}}>
                Current Performance
              </h4>
              <div style={styles.metricsGrid}>
                <div style={styles.metricItem}>
                  <div style={styles.metricLabel}>CPU Usage</div>
                  <div style={{
                    ...styles.metricValue,
                    color: getMetricColor(selectedStation.cpu, "cpu")
                  }}>
                    {selectedStation.cpu}%
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <div style={styles.metricLabel}>GPU Usage</div>
                  <div style={{
                    ...styles.metricValue,
                    color: getMetricColor(selectedStation.gpu, "gpu")
                  }}>
                    {selectedStation.gpu}%
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <div style={styles.metricLabel}>RAM Usage</div>
                  <div style={{
                    ...styles.metricValue,
                    color: getMetricColor(selectedStation.ram, "ram")
                  }}>
                    {selectedStation.ram}%
                  </div>
                </div>
                <div style={styles.metricItem}>
                  <div style={styles.metricLabel}>Temperature</div>
                  <div style={{
                    ...styles.metricValue,
                    color: getMetricColor(selectedStation.temp, "temp")
                  }}>
                    {selectedStation.temp}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Issues */}
            {selectedStation.issues.length > 0 && (
              <div style={{marginBottom: "1.5rem"}}>
                <h4 style={{fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem", color: "#EF4444"}}>
                  ⚠️ Reported Issues
                </h4>
                <ul style={{paddingLeft: "1.5rem", color: "#FCA5A5"}}>
                  {selectedStation.issues.map((issue, index) => (
                    <li key={index} style={{marginBottom: "0.5rem"}}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Maintenance Info */}
            <div style={{marginBottom: "1.5rem"}}>
              <h4 style={{fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem"}}>
                Maintenance Information
              </h4>
              <div style={{color: "#9CA3AF"}}>
                Last maintenance: <strong style={{color: "white"}}>{selectedStation.lastMaintenance}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
              {selectedStation.status === "active" && (
                <>
                  <button
                    onClick={() => {
                      handleStationAction(selectedStation.id, "restart");
                      setSelectedStation(null);
                    }}
                    style={{...styles.button, ...styles.warningButton}}
                  >
                    🔄 Restart Station
                  </button>
                  <button
                    onClick={() => {
                      handleStationAction(selectedStation.id, "maintenance");
                      setSelectedStation(null);
                    }}
                    style={{...styles.button, ...styles.secondaryButton}}
                  >
                    🔧 Set Maintenance
                  </button>
                </>
              )}
              
              {selectedStation.status === "available" && (
                <button
                  onClick={() => {
                    handleStationAction(selectedStation.id, "shutdown");
                    setSelectedStation(null);
                  }}
                  style={{...styles.button, ...styles.dangerButton}}
                >
                  🔌 Shutdown
                </button>
              )}
              
              {(selectedStation.status === "maintenance" || selectedStation.status === "offline") && (
                <button
                  onClick={() => {
                    handleStationAction(selectedStation.id, "activate");
                    setSelectedStation(null);
                  }}
                  style={{...styles.button, ...styles.successButton}}
                >
                  ✅ Activate Station
                </button>
              )}
              
              <button
                onClick={() => setSelectedStation(null)}
                style={{...styles.button, ...styles.secondaryButton}}
              >
                📋 Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}