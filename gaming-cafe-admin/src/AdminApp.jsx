import { useState, useEffect } from "react";
import AdminLogin from './AdminLogin.jsx';
import AdminUserManagement from './AdminUserManagement.jsx';
import AdminReports from './AdminUserReports.jsx';
import AdminSettings from './AdminSettings.jsx';
import AdminInventoryManagement from './AdminInventoryManagement.jsx';

export default function AdminApp() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentSection, setCurrentSection] = useState("reports");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminInfo, setAdminInfo] = useState({
    name: "Administrator",
    role: "System Admin",
    lastLogin: "Today 14:30",
    accessLevel: "Full Access"
  });

  const [systemStats, setSystemStats] = useState({
    totalUsers: 247,
    activeUsers: 18,
    totalRevenue: "Rp 12,450,000",
    systemUptime: "99.8%",
    alerts: 3,
    pendingReports: 5
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    {
      id: "reports",
      label: "User Reports",
      icon: "📋",
      description: "Handle user complaints"
    },
    {
      id: "users",
      label: "User Management",
      icon: "👥",
      description: "Manage users & sessions"
    },
    {
      id: "inventory",
      label: "Inventory Management",
      icon: "📦",
      description: "Manage menu items & stock"
    },
    {
      id: "settings",
      label: "Admin Settings",
      icon: "⚙️",
      description: "System configuration"
    }
  ];

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
  };

  if (!isAdminLoggedIn) {
    return <AdminLogin onAdminLogin={handleAdminLogin} />;
  }

  const renderSection = () => {
    console.log('🔍 Rendering section:', currentSection);
    
    try {
      switch (currentSection) {
        case "reports":
          console.log('📋 Loading AdminReports component...');
          return <AdminReports />;
        case "users":
          console.log('👥 Loading AdminUserManagement component...');
          return <AdminUserManagement />;
        case "inventory":
          console.log('📦 Loading AdminInventoryManagement component...');
          return <AdminInventoryManagement />;
        case "settings":
          console.log('⚙️ Loading AdminSettings component...');
          return <AdminSettings />;
        default:
          console.log('📋 Loading default AdminReports component...');
          return <AdminReports />;
      }
    } catch (error) {
      console.error('❌ Error rendering section:', error);
      return (
        <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
          <h2>Error Loading Component</h2>
          <p>Section: {currentSection}</p>
          <p>Error: {error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNavButtonStyle = (item, isActive, isHovered) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "0.75rem",
    textAlign: "left",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    transition: "all 0.3s ease",
    cursor: "pointer",
    border: "none",
    background: isActive 
      ? "linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.3) 100%)"
      : isHovered 
        ? "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.4) 100%)"
        : "transparent",
    color: isActive ? "#F87171" : isHovered ? "white" : "#D1D5DB",
    borderLeft: isActive ? "3px solid #EF4444" : "3px solid transparent",
    boxShadow: isActive 
      ? "0 4px 15px rgba(0, 0, 0, 0.2)" 
      : isHovered 
        ? "0 2px 8px rgba(0, 0, 0, 0.1)" 
        : "none",
    transform: isActive 
      ? "scale(1.02)" 
      : isHovered 
        ? "scale(1.01)" 
        : "scale(1)"
  });

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      backgroundColor: "#111827",
      color: "white",
      overflow: "hidden"
    },
    sidebar: {
      height: "100%",
      background: "linear-gradient(180deg, #374151 0%, #374151 50%, #111827 100%)",
      transition: "all 0.3s ease",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
      borderRight: "1px solid rgba(75, 85, 99, 0.5)",
      backdropFilter: "blur(20px)",
      zIndex: 50,
      flexShrink: 0,
      width: sidebarOpen ? "288px" : "80px",
      display: "flex",
      flexDirection: "column"
    },
    sidebarHeader: {
      position: "relative",
      flexShrink: 0
    },
    toggleButton: {
      position: "absolute",
      top: "1rem",
      right: "1rem",
      zIndex: 10,
      padding: "0.5rem",
      borderRadius: "0.5rem",
      backgroundColor: "rgba(75, 85, 99, 0.5)",
      border: "1px solid rgba(107, 114, 128, 0.5)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: "1.125rem",
      color: "white"
    },
    brandSection: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem 1rem",
      background: "linear-gradient(135deg, rgba(185, 28, 28, 0.3) 0%, rgba(234, 88, 12, 0.3) 100%)",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)",
      backdropFilter: "blur(10px)"
    },
    brandText: {
      textAlign: "center"
    },
    brandTitle: {
      color: "#F87171",
      fontWeight: "700",
      fontSize: sidebarOpen ? "1.5rem" : "2rem",
      letterSpacing: "0.1em",
      position: "relative"
    },
    brandSubtitle: {
      fontSize: "0.875rem",
      color: "#D1D5DB",
      letterSpacing: "0.2em",
      fontWeight: "400",
      marginTop: "0.25rem"
    },
    brandGlow: {
      position: "absolute",
      inset: "-0.5rem",
      background: "rgba(248, 113, 113, 0.1)",
      borderRadius: "0.75rem",
      filter: "blur(12px)",
      zIndex: -1
    },
    adminInfoCard: {
      margin: "0.75rem 1rem 0 1rem",
      padding: "0.75rem",
      background: "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.6) 100%)",
      borderRadius: "0.5rem",
      border: "1px solid rgba(107, 114, 128, 0.3)",
      backdropFilter: "blur(10px)"
    },
    adminProfile: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "0.5rem"
    },
    adminAvatar: {
      width: "2.5rem",
      height: "2.5rem",
      background: "linear-gradient(135deg, #F87171 0%, #FB923C 100%)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "700",
      fontSize: "1rem"
    },
    adminDetails: {
      flex: 1
    },
    adminName: {
      color: "white",
      fontWeight: "500",
      fontSize: "0.875rem"
    },
    adminRole: {
      color: "#9CA3AF",
      fontSize: "0.75rem"
    },
    separator: {
      height: "1px",
      background: "rgba(107, 114, 128, 0.5)",
      marginBottom: "0.5rem"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.5rem",
      fontSize: "0.75rem"
    },
    statCard: {
      backgroundColor: "rgba(55, 65, 81, 0.5)",
      borderRadius: "0.375rem",
      padding: "0.5rem",
      textAlign: "center",
      border: "1px solid rgba(75, 85, 99, 0.3)"
    },
    statValue: {
      fontWeight: "600",
      fontSize: "0.75rem",
      marginBottom: "0.125rem"
    },
    statLabel: {
      color: "#9CA3AF"
    },
    quickStats: {
      marginTop: "0.5rem",
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.375rem",
      fontSize: "0.75rem"
    },
    alertStat: {
      backgroundColor: "rgba(180, 83, 9, 0.2)",
      borderRadius: "0.375rem",
      padding: "0.375rem",
      textAlign: "center",
      border: "1px solid rgba(180, 83, 9, 0.3)"
    },
    reportStat: {
      backgroundColor: "rgba(234, 88, 12, 0.2)",
      borderRadius: "0.375rem",
      padding: "0.375rem",
      textAlign: "center",
      border: "1px solid rgba(234, 88, 12, 0.3)"
    },
    navigation: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "0 1rem",
      marginTop: "1rem",
      paddingBottom: "1rem",
      minHeight: 0
    },
    navSection: {
      flex: 1,
      overflowY: "auto",
      minHeight: 0,
      marginBottom: "1rem"
    },
    navItems: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem"
    },
    navLabel: {
      color: "#9CA3AF",
      fontSize: "0.75rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      padding: "0 0.75rem",
      marginBottom: "1rem"
    },
    navIcon: {
      fontSize: "1.25rem",
      transition: "transform 0.2s ease"
    },
    navContent: {
      flex: 1
    },
    navTitle: {
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    navDescription: {
      fontSize: "0.6875rem",
      color: "#9CA3AF",
      transition: "color 0.2s ease"
    },
    activeIndicator: {
      position: "absolute",
      right: "0.75rem",
      width: "0.5rem",
      height: "0.5rem",
      backgroundColor: "currentColor",
      borderRadius: "50%",
      animation: "pulse 2s infinite"
    },
    hoverOverlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "0.75rem",
      opacity: 0,
      transition: "opacity 0.2s ease",
      pointerEvents: "none"
    },
    bottomSection: {
      flexShrink: 0,
      paddingTop: "1rem",
      borderTop: "1px solid rgba(75, 85, 99, 0.3)"
    },
    logoutButton: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      textAlign: "left",
      padding: "0.75rem",
      borderRadius: "0.5rem",
      background: "transparent",
      border: "1px solid rgba(185, 28, 28, 0.3)",
      color: "#F87171",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 8px rgba(185, 28, 28, 0.15)",
      justifyContent: sidebarOpen ? "flex-start" : "center",
      width: "100%"
    },
    logoutIcon: {
      fontSize: "1rem",
      transition: "transform 0.2s ease"
    },
    logoutText: {
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      transition: "all 0.3s ease"
    },
    topBar: {
      flexShrink: 0,
      background: "rgba(17, 24, 39, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)",
      padding: "0.75rem 1.5rem"
    },
    topBarContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    pageTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "white",
      textTransform: "capitalize"
    },
    statusIndicators: {
      display: "flex",
      alignItems: "center",
      gap: "1rem"
    },
    statusGroup: {
      display: "flex",
      alignItems: "center",
      gap: "1rem"
    },
    onlineStatus: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    statusDot: {
      width: "0.5rem",
      height: "0.5rem",
      backgroundColor: "#10B981",
      borderRadius: "50%",
      animation: "pulse 2s infinite"
    },
    statusText: {
      fontSize: "0.875rem",
      color: "#D1D5DB"
    },
    usersBadge: {
      fontSize: "0.875rem",
      color: "#D1D5DB",
      backgroundColor: "rgba(55, 65, 81, 0.5)",
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px"
    },
    alertBadge: {
      fontSize: "0.875rem",
      color: "#FCD34D",
      backgroundColor: "rgba(180, 83, 9, 0.3)",
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      border: "1px solid rgba(180, 83, 9, 0.5)"
    },
    pageContent: {
      flex: 1,
      overflowY: "auto",
      backgroundColor: "#111827"
    },
    contentWrapper: {
      minHeight: "100%"
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <button
            onClick={toggleSidebar}
            style={styles.toggleButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(107, 114, 128, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(75, 85, 99, 0.5)";
            }}
          >
            {sidebarOpen ? "←" : "→"}
          </button>

          <div style={styles.brandSection}>
            <div style={styles.brandText}>
              <div style={styles.brandTitle}>
                {sidebarOpen ? (
                  <>
                    ICHI ADMIN
                    <div style={styles.brandSubtitle}>CONTROL PANEL</div>
                  </>
                ) : (
                  "🛡️"
                )}
                <div style={styles.brandGlow}></div>
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <div style={styles.adminInfoCard}>
              <div style={styles.adminProfile}>
                <div style={styles.adminAvatar}>
                  {adminInfo.name.charAt(0)}
                </div>
                <div style={styles.adminDetails}>
                  <div style={styles.adminName}>{adminInfo.name}</div>
                  <div style={styles.adminRole}>{adminInfo.role}</div>
                </div>
              </div>
              
              <div style={styles.separator}></div>
              
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: "#F87171"}}>{adminInfo.lastLogin}</div>
                  <div style={styles.statLabel}>Last Login</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: "#10B981"}}>{adminInfo.accessLevel}</div>
                  <div style={styles.statLabel}>Access Level</div>
                </div>
              </div>

              <div style={styles.quickStats}>
                <div style={styles.alertStat}>
                  <div style={{...styles.statValue, color: "#FCD34D", fontSize: "1.125rem"}}>{systemStats.alerts}</div>
                  <div style={{...styles.statLabel, fontSize: "0.75rem"}}>Alerts</div>
                </div>
                <div style={styles.reportStat}>
                  <div style={{...styles.statValue, color: "#FB923C", fontSize: "1.125rem"}}>{systemStats.pendingReports}</div>
                  <div style={{...styles.statLabel, fontSize: "0.75rem"}}>Reports</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav style={styles.navigation}>
          <div style={styles.navSection}>
            <div style={styles.navItems}>
              {sidebarOpen && (
                <div style={styles.navLabel}>
                  Admin Tools
                </div>
              )}
              
              {navigationItems.map((item) => {
                const isActive = currentSection === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSection(item.id);
                    }}
                    style={getNavButtonStyle(item, isActive, false)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.background = "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.4) 100%)";
                        e.target.style.color = "white";
                        e.target.style.transform = "scale(1.02)";
                        e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) icon.style.transform = "scale(1.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#D1D5DB";
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "none";
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) icon.style.transform = "scale(1)";
                      }
                    }}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <span className="nav-icon" style={styles.navIcon}>
                      {item.icon}
                    </span>
                    
                    {sidebarOpen && (
                      <div style={styles.navContent}>
                        <div style={styles.navTitle}>{item.label}</div>
                        <div style={styles.navDescription}>
                          {item.description}
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <div style={styles.activeIndicator}></div>
                    )}

                    <div style={styles.hoverOverlay}></div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div style={styles.bottomSection}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm("Are you sure you want to logout from admin panel?")) {
                  setIsAdminLoggedIn(false);
                }
              }}
              style={styles.logoutButton}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(185, 28, 28, 0.3)";
                e.target.style.color = "#FCA5A5";
                e.target.style.transform = "scale(1.02)";
                e.target.style.borderColor = "rgba(239, 68, 68, 0.5)";
                const icon = e.target.querySelector('.logout-icon');
                if (icon) icon.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#F87171";
                e.target.style.transform = "scale(1)";
                e.target.style.borderColor = "rgba(185, 28, 28, 0.3)";
                const icon = e.target.querySelector('.logout-icon');
                if (icon) icon.style.transform = "scale(1)";
              }}
              title={!sidebarOpen ? 'Admin Logout' : ''}
            >
              <span className="logout-icon" style={styles.logoutIcon}>🚪</span>
              {sidebarOpen && (
                <span style={styles.logoutText}>Logout</span>
              )}
            </button>
          </div>
        </nav>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.topBar}>
          <div style={styles.topBarContent}>
            <h1 style={styles.pageTitle}>
              Admin {currentSection === 'reports' ? 'User Reports' : 
                     currentSection === 'users' ? 'User Management' :
                     currentSection === 'inventory' ? 'Inventory Management' :
                     currentSection === 'settings' ? 'Settings' :
                     currentSection}
            </h1>
            
            <div style={styles.statusIndicators}>
              <div style={styles.statusGroup}>
                <div style={styles.onlineStatus}>
                  <div style={styles.statusDot}></div>
                  <span style={styles.statusText}>System Online</span>
                </div>
                
                <div style={styles.usersBadge}>
                  {systemStats.activeUsers} Active Users
                </div>

                {systemStats.alerts > 0 && (
                  <div style={styles.alertBadge}>
                    {systemStats.alerts} Alerts
                  </div>
                )}
              </div>
              
              {!sidebarOpen && (
                <div style={styles.statusText}>
                  {formatTime(currentTime)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.pageContent}>
          <div style={styles.contentWrapper}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}