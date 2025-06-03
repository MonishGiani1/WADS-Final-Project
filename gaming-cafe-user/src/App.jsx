import { useState, useEffect } from "react";
import GamingSection from './GamingSection.jsx';
import QuotaPage from './QuotaPage.jsx';
import LoginRegistration from './LoginRegistration.jsx';
import FoodPage from './FoodPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import ReportsPage from './ReportsPage.jsx';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSection, setCurrentSection] = useState("gaming");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userInfo, setUserInfo] = useState({
    name: "John Doe",
    station: "PC-05",
    remainingTime: "0m",
    balance: "Rp 0"
  });
  const [gamingTimer, setGamingTimer] = useState(null); // For countdown timer
  const [isGaming, setIsGaming] = useState(false); // Gaming session state

  // Helper function to format gaming time
  const formatGamingTime = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Helper function to format balance
  const formatBalance = (amount) => {
    return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
  };

  // 🔥 NEW: Function to save timer state to database
  const saveTimerState = async (userId, remainingSeconds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !userId) return;

      const usedMinutes = Math.floor((gamingTimer - remainingSeconds) / 60);
      
      await fetch(`/api/users/${userId}/timer-state`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionUsedMinutes: usedMinutes,
          lastTimerUpdate: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔥 UPDATED: Gaming countdown timer with database persistence
  useEffect(() => {
    let countdownTimer;
    
    if (isGaming && gamingTimer > 0) {
      countdownTimer = setInterval(() => {
        setGamingTimer(prev => {
          const newTime = prev - 1;
          
          // Update displayed time
          setUserInfo(prevInfo => ({
            ...prevInfo,
            remainingTime: formatGamingTime(Math.floor(newTime / 60))
          }));
          
          // 🔥 SECURITY FIX: Save to database every 10 seconds
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.id && newTime % 10 === 0) {
            saveTimerState(user.id, newTime);
          }
          
          // Stop gaming when time reaches 0
          if (newTime <= 0) {
            setIsGaming(false);
            // Final save when timer expires
            if (user.id) {
              saveTimerState(user.id, 0);
            }
            alert("⏰ Gaming time expired! Please purchase more time to continue.");
            return 0;
          }
          
          return newTime;
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [isGaming, gamingTimer]);

  // 🔥 UPDATED: Save timer state when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isGaming && gamingTimer > 0) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          await saveTimerState(user.id, gamingTimer);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGaming, gamingTimer]);

  // Check for existing user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Found stored user data:', userData);
        handleLogin(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Navigation items with enhanced properties
  const navigationItems = [
    {
      id: "gaming",
      label: "Gaming",
      icon: "🎮",
      description: "Game Library & Play"
    },
    {
      id: "food",
      label: "Food & Drinks",
      icon: "🍔",
      description: "Order snacks & beverages"
    },
    {
      id: "quota",
      label: "Top Up",
      icon: "💳",
      description: "Add gaming time & balance"
    },
    {
      id: "reports",
      label: "Reports",
      icon: "📊",
      description: "Analytics & user reports"
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      description: "Account & preferences"
    }
  ];

  // 🔥 UPDATED: Function to handle successful login with timer restoration
  const handleLogin = async (userData) => {
    console.log('handleLogin called with:', userData);
    setIsLoggedIn(true);
    
    // Update userInfo with real data from login
    if (userData) {
      try {
        // 🔥 SECURITY FIX: Fetch current timer state from database
        const token = localStorage.getItem('token');
        let actualRemainingMinutes = userData.gamingQuotaMinutes || 0;
        let shouldAutoStart = false;

        if (userData.id && token) {
          const response = await fetch(`/api/users/${userData.id}/quota`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const quotaData = await response.json();
            // Calculate actual remaining time based on used minutes
            actualRemainingMinutes = Math.max(0, 
              (quotaData.gamingQuotaMinutes || 0) - (quotaData.sessionUsedMinutes || 0)
            );
            
            console.log('🔒 Timer state restored:', {
              total: quotaData.gamingQuotaMinutes,
              used: quotaData.sessionUsedMinutes,
              remaining: actualRemainingMinutes
            });
            
            shouldAutoStart = actualRemainingMinutes > 0;
          }
        }

        const updatedUserInfo = {
          name: userData.fullName || "User",
          station: "PC-05", // Could be dynamically assigned later
          remainingTime: formatGamingTime(actualRemainingMinutes),
          balance: formatBalance(userData.totalSpent || 0)
        };
        
        console.log('Setting userInfo to:', updatedUserInfo);
        setUserInfo(updatedUserInfo);
        
        // 🔥 SECURITY FIX: Set timer to actual remaining time, not full quota
        const remainingSeconds = actualRemainingMinutes * 60;
        setGamingTimer(remainingSeconds);
        
        // 🔥 AUTO-START GAMING: Only if there's actual time remaining
        if (shouldAutoStart) {
          setIsGaming(true);
          console.log('🎮 Auto-starting gaming session with', actualRemainingMinutes, 'minutes remaining');
        } else {
          console.log('⏸️ No gaming time remaining or session completed');
        }
      } catch (error) {
        console.error('Error fetching timer state during login:', error);
        // Fallback to userData values
        const gamingMinutes = userData.gamingQuotaMinutes || 0;
        setUserInfo({
          name: userData.fullName || "User",
          station: "PC-05",
          remainingTime: formatGamingTime(gamingMinutes),
          balance: formatBalance(userData.totalSpent || 0)
        });
        setGamingTimer(gamingMinutes * 60);
        if (gamingMinutes > 0) {
          setIsGaming(true);
        }
      }
    }
  };

  // Function to start/stop gaming session
  const toggleGamingSession = () => {
    if (gamingTimer <= 0) {
      alert("❌ No gaming time remaining! Please purchase more time.");
      return;
    }
    
    setIsGaming(!isGaming);
    
    if (!isGaming) {
      alert("🎮 Gaming session started! Timer is now counting down.");
    } else {
      alert("⏸️ Gaming session paused.");
      // Save state when manually pausing
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        saveTimerState(user.id, gamingTimer);
      }
    }
  };

  // 🔥 UPDATED: Function to update user info with proper timer handling
  const updateUserInfo = (newData) => {
    setUserInfo(prevInfo => ({
      ...prevInfo,
      ...newData,
      remainingTime: newData.gamingQuotaMinutes ? formatGamingTime(newData.gamingQuotaMinutes) : prevInfo.remainingTime,
      balance: newData.totalSpent !== undefined ? formatBalance(newData.totalSpent) : prevInfo.balance
    }));
    
    // Update gaming timer when quota changes (e.g., after purchase)
    if (newData.gamingQuotaMinutes !== undefined) {
      // 🔥 SECURITY FIX: When adding quota, add to existing timer rather than replacing
      if (newData.quotaAdded) {
        // This is a quota addition, add to existing timer
        const additionalSeconds = newData.quotaAdded * 60;
        setGamingTimer(prev => prev + additionalSeconds);
        console.log('🎮 Added', newData.quotaAdded, 'minutes to existing timer');
      } else {
        // This is a full timer update (from database fetch)
        const newSeconds = newData.gamingQuotaMinutes * 60;
        setGamingTimer(newSeconds);
      }
      
      // If timer was at 0 and user just bought more time, auto-start gaming
      if (gamingTimer <= 0 && newData.gamingQuotaMinutes > 0) {
        setIsGaming(true);
        console.log('🎮 Auto-restarting gaming session after quota purchase');
      }
    }
  };

  // 🔥 UPDATED: Function to handle logout with timer state save
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // 🔥 SECURITY FIX: Save final timer state before logout
      if (isGaming && gamingTimer > 0) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          await saveTimerState(user.id, gamingTimer);
          console.log('💾 Timer state saved before logout');
        }
      }
      
      // Stop the gaming timer
      setIsGaming(false);
      setGamingTimer(0);
      
      setIsLoggedIn(false);
      setUserInfo({
        name: "John Doe",
        station: "PC-05",
        remainingTime: "0m",
        balance: "Rp 0"
      });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  // Show login screen first if not logged in
  if (!isLoggedIn) {
    return <LoginRegistration onLogin={handleLogin} />;
  }

  // If logged in, show the main application with sidebar
  const renderSection = () => {
    switch (currentSection) {
      case "gaming":
        return <GamingSection userInfo={userInfo} updateUserInfo={updateUserInfo} />;
      case "quota":
        return <QuotaPage userInfo={userInfo} updateUserInfo={updateUserInfo} />;
      case "food":
        return <FoodPage userInfo={userInfo} updateUserInfo={updateUserInfo} />;
      case "reports":
        return <ReportsPage userInfo={userInfo} />;
      case "settings":
        return <SettingsPage userInfo={userInfo} updateUserInfo={updateUserInfo} />;
      default:
        return <GamingSection userInfo={userInfo} updateUserInfo={updateUserInfo} />;
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Format time
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
      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)"
      : isHovered 
        ? "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.4) 100%)"
        : "transparent",
    color: isActive ? "#34D399" : isHovered ? "white" : "#D1D5DB",
    borderLeft: isActive ? "3px solid #10B981" : "3px solid transparent",
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
      background: "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)",
      backdropFilter: "blur(10px)"
    },
    brandText: {
      textAlign: "center"
    },
    brandTitle: {
      color: "#34D399",
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
      background: "rgba(52, 211, 153, 0.1)",
      borderRadius: "0.75rem",
      filter: "blur(12px)",
      zIndex: -1
    },
    userInfoCard: {
      margin: "0.75rem 1rem 0 1rem",
      padding: "0.75rem",
      background: "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.6) 100%)",
      borderRadius: "0.5rem",
      border: "1px solid rgba(107, 114, 128, 0.3)",
      backdropFilter: "blur(10px)"
    },
    userProfile: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "0.5rem"
    },
    userAvatar: {
      width: "2.5rem",
      height: "2.5rem",
      background: "linear-gradient(135deg, #34D399 0%, #3B82F6 100%)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "700",
      fontSize: "1rem"
    },
    userDetails: {
      flex: 1
    },
    userName: {
      color: "white",
      fontWeight: "500",
      fontSize: "0.875rem"
    },
    userStation: {
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
    timeDisplay: {
      padding: "1rem",
      backgroundColor: "rgba(55, 65, 81, 0.4)",
      borderRadius: "0.75rem",
      border: "1px solid rgba(75, 85, 99, 0.3)",
      textAlign: "center",
      backdropFilter: "blur(10px)",
      marginBottom: "1rem"
    },
    timeValue: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "white",
      marginBottom: "0.25rem"
    },
    dateValue: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
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

      {/* Enhanced User Sidebar */}
      <div style={styles.sidebar}>
        {/* Header Section */}
        <div style={styles.sidebarHeader}>
          {/* Toggle Button */}
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

          {/* Enhanced Brand Logo */}
          <div style={styles.brandSection}>
            <div style={styles.brandText}>
              <div style={styles.brandTitle}>
                {sidebarOpen ? (
                  <>
                    ICHI GAMING
                    <div style={styles.brandSubtitle}>CAFE</div>
                  </>
                ) : (
                  "🎮"
                )}
                <div style={styles.brandGlow}></div>
              </div>
            </div>
          </div>

          {/* Enhanced User Info Card with Real Data */}
          {sidebarOpen && (
            <div style={styles.userInfoCard}>
              {/* User Profile Section */}
              <div style={styles.userProfile}>
                <div style={styles.userAvatar}>
                  {userInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div style={styles.userDetails}>
                  <div style={styles.userName}>{userInfo.name}</div>
                  <div style={styles.userStation}>{userInfo.station}</div>
                </div>
              </div>
              
              {/* Separator Line */}
              <div style={styles.separator}></div>
              
              {/* Enhanced User Stats Grid with Real Data */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{
                    ...styles.statValue, 
                    color: gamingTimer <= 300 ? "#EF4444" : "#34D399" // Red if less than 5 minutes
                  }}>
                    {userInfo.remainingTime}
                    {isGaming && (
                      <span style={{fontSize: "0.6rem", marginLeft: "0.25rem", color: "#10B981"}}>
                        ⏱️
                      </span>
                    )}
                  </div>
                  <div style={styles.statLabel}>
                    {isGaming ? "Gaming..." : "Time Left"}
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: "#3B82F6"}}>{userInfo.balance}</div>
                  <div style={styles.statLabel}>Balance</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Navigation */}
        <nav style={styles.navigation}>
          {/* Navigation Items Container */}
          <div style={styles.navSection}>
            <div style={styles.navItems}>
              {/* Navigation section label */}
              {sidebarOpen && (
                <div style={styles.navLabel}>
                  Navigation
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

                    {/* Active indicator */}
                    {isActive && (
                      <div style={styles.activeIndicator}></div>
                    )}

                    {/* Hover effect overlay */}
                    <div style={styles.hoverOverlay}></div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Enhanced Bottom Section */}
          <div style={styles.bottomSection}>
            {/* Time Display */}
            {sidebarOpen && (
              <div style={styles.timeDisplay}>
                <div style={styles.timeValue}>
                  {formatTime(currentTime)}
                </div>
                <div style={styles.dateValue}>
                  {formatDate(currentTime)}
                </div>
              </div>
            )}

            {/* Logout button */}
            <button 
              onClick={handleLogout}
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
              title={!sidebarOpen ? 'Logout' : ''}
            >
              <span className="logout-icon" style={styles.logoutIcon}>🚪</span>
              {sidebarOpen && (
                <span style={styles.logoutText}>Logout</span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        {/* Enhanced Top bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarContent}>
            <h1 style={styles.pageTitle}>
              {currentSection === 'quota' ? 'Top Up' : 
               currentSection === 'reports' ? 'Reports & Analytics' : 
               currentSection}
            </h1>
            
            <div style={styles.statusIndicators}>
              {/* Enhanced Status indicators */}
              <div style={styles.statusGroup}>
                <div style={styles.onlineStatus}>
                  <div style={styles.statusDot}></div>
                  <span style={styles.statusText}>Online</span>
                </div>
              </div>
              
              {/* Current time for collapsed sidebar */}
              {!sidebarOpen && (
                <div style={styles.statusText}>
                  {formatTime(currentTime)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={styles.pageContent}>
          <div style={styles.contentWrapper}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}