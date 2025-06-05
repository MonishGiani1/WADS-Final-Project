import { useState, useEffect } from "react";
import CheckoutPage from "./CheckoutPage";

export default function QuotaPage({ userInfo, updateUserInfo }) {
  // 🔒 SECURITY: Real user data from database - NO MANUAL CONTROL
  const [userQuota, setUserQuota] = useState({
    totalMinutes: 0,      // Total gaming time purchased
    usedMinutes: 0,       // Time already used in current session
    remainingMinutes: 0   // Available time left
  });
  
  // 🔒 SECURITY: Auto-timer states - NO USER CONTROL
  const [gamingTimer, setGamingTimer] = useState(null); // Timer in seconds
  const [isGaming, setIsGaming] = useState(false); // Gaming session state (auto-managed)
  const [displayTime, setDisplayTime] = useState(0); // For real-time display
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔒 SECURITY: Gaming time packages (could also be loaded from DB)
  const quotaPlans = [
    { id: 1, name: "30 Min Boost", price: 10000, time: 30, minutes: 30, icon: "⚡" },
    { id: 2, name: "1 Hour Boost", price: 20000, time: 60, minutes: 60, icon: "⏱️" },
    { id: 3, name: "2 Hour Boost", price: 40000, time: 120, minutes: 120, icon: "🕒" },
    { id: 4, name: "4 Hour Boost", price: 75000, time: 240, minutes: 240, icon: "🔋" },
    { id: 5, name: "All Day Pass", price: 150000, time: 720, minutes: 720, icon: "🎮" },
  ];

  // 🔒 SECURITY: Function to save timer state to database (background only)
  const saveTimerState = async (remainingSeconds) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      if (!token || !user.id) return;

      const totalSeconds = userQuota.totalMinutes * 60;
      const usedMinutes = Math.floor((totalSeconds - remainingSeconds) / 60);
      
      await fetch(`user-backend.up.railway.app/api/users/${user.id}/timer-state`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionUsedMinutes: Math.max(0, usedMinutes),
          lastTimerUpdate: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  // 🔒 SECURITY: Auto-timer countdown - NO USER CONTROL ALLOWED
  useEffect(() => {
    let countdownTimer;
    
    // Timer runs automatically when there's time available
    if (isGaming && gamingTimer > 0) {
      countdownTimer = setInterval(() => {
        setGamingTimer(prev => {
          const newTime = prev - 1;
          setDisplayTime(newTime);
          
          // Update quota display
          const newMinutes = Math.floor(newTime / 60);
          setUserQuota(prevQuota => ({
            ...prevQuota,
            remainingMinutes: newMinutes,
            usedMinutes: prevQuota.totalMinutes - newMinutes
          }));
          
          // Update parent component if available
          if (updateUserInfo) {
            updateUserInfo({
              remainingTime: formatGamingTime(newMinutes)
            });
          }
          
          // 🔒 SECURITY: Save to database every 10 seconds
          if (newTime % 10 === 0) {
            saveTimerState(newTime);
          }
          
          // 🔒 SECURITY: Auto-stop when time reaches 0 - NO USER BYPASS
          if (newTime <= 0) {
            setIsGaming(false);
            saveTimerState(0);
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
  }, [isGaming, gamingTimer, updateUserInfo, userQuota.totalMinutes]);

  // 🔒 SECURITY: Save timer state when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isGaming && gamingTimer > 0) {
        await saveTimerState(gamingTimer);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGaming, gamingTimer]);

  // 🔒 SECURITY: Load user gaming quota and AUTO-START timer
  useEffect(() => {
    const loadUserQuota = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        if (user.id && token) {
          const response = await fetch(`user-backend.up.railway.app/api/users/${user.id}/quota`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // 🔒 SECURITY: Calculate actual remaining time
            const totalMinutes = data.gamingQuotaMinutes || 0;
            const usedMinutes = data.sessionUsedMinutes || 0;
            const actualRemainingMinutes = Math.max(0, totalMinutes - usedMinutes);
            
            const quotaData = {
              totalMinutes: totalMinutes,
              usedMinutes: usedMinutes,
              remainingMinutes: actualRemainingMinutes
            };
            
            setUserQuota(quotaData);
            
            // 🔒 SECURITY: Set timer to actual remaining time
            const remainingSeconds = actualRemainingMinutes * 60;
            setGamingTimer(remainingSeconds);
            setDisplayTime(remainingSeconds);
            
            console.log('🔒 Auto-loading timer state:', {
              total: totalMinutes,
              used: usedMinutes,
              remaining: actualRemainingMinutes,
              seconds: remainingSeconds
            });
            
            // 🔒 SECURITY: AUTO-START timer if there's time remaining
            if (actualRemainingMinutes > 0) {
              setIsGaming(true);
              console.log('🎮 Auto-starting gaming session with', actualRemainingMinutes, 'minutes');
            } else {
              console.log('⏸️ No gaming time remaining');
            }
            
          } else {
            // Fallback to localStorage if API fails
            const quotaData = {
              totalMinutes: user.gamingQuotaMinutes || 0,
              usedMinutes: 0,
              remainingMinutes: user.gamingQuotaMinutes || 0
            };
            setUserQuota(quotaData);
            const seconds = (user.gamingQuotaMinutes || 0) * 60;
            setGamingTimer(seconds);
            setDisplayTime(seconds);
            
            // Auto-start if time available
            if (user.gamingQuotaMinutes > 0) {
              setIsGaming(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user quota:', error);
        setError('Failed to load gaming quota');
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const quotaData = {
          totalMinutes: user.gamingQuotaMinutes || 0,
          usedMinutes: 0,
          remainingMinutes: user.gamingQuotaMinutes || 0
        };
        setUserQuota(quotaData);
        const seconds = (user.gamingQuotaMinutes || 0) * 60;
        setGamingTimer(seconds);
        setDisplayTime(seconds);
        
        // Auto-start if time available
        if (user.gamingQuotaMinutes > 0) {
          setIsGaming(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserQuota();
  }, []);

  // 🔒 SECURITY: Refresh quota data after purchase with proper timer handling
  const refreshQuotaData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (user.id && token) {
        const response = await fetch(`user-backend.up.railway.app/api/users/${user.id}/quota`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // 🔒 SECURITY: Calculate remaining time properly after purchase
          const totalMinutes = data.gamingQuotaMinutes || 0;
          const usedMinutes = data.sessionUsedMinutes || 0;
          const actualRemainingMinutes = Math.max(0, totalMinutes - usedMinutes);
          
          const quotaData = {
            totalMinutes: totalMinutes,
            usedMinutes: usedMinutes,
            remainingMinutes: actualRemainingMinutes
          };
          
          setUserQuota(quotaData);
          
          // 🔒 SECURITY: Add to existing timer or set new timer
          const newRemainingSeconds = actualRemainingMinutes * 60;
          if (isGaming && gamingTimer > 0) {
            // If timer was running, add the purchased time to current timer
            const purchasedMinutes = selectedPlan?.minutes || 0;
            const additionalSeconds = purchasedMinutes * 60;
            setGamingTimer(prev => prev + additionalSeconds);
            setDisplayTime(prev => prev + additionalSeconds);
            console.log('🎮 Added', purchasedMinutes, 'minutes to running timer');
          } else {
            // If timer wasn't running, set to total remaining time
            setGamingTimer(newRemainingSeconds);
            setDisplayTime(newRemainingSeconds);
          }
          
          // Update localStorage user data
          const updatedUser = { ...user, gamingQuotaMinutes: data.gamingQuotaMinutes };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update parent component
          if (updateUserInfo) {
            updateUserInfo({
              gamingQuotaMinutes: actualRemainingMinutes,
              quotaAdded: selectedPlan?.minutes,
              remainingTime: formatGamingTime(actualRemainingMinutes)
            });
          }
          
          // 🔒 SECURITY: AUTO-RESTART timer if user bought more time
          if (!isGaming && actualRemainingMinutes > 0) {
            setIsGaming(true);
            console.log('🎮 Auto-restarting gaming session after quota purchase');
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing quota data:', error);
    }
  };

  // Format price to Indonesian Rupiah
  const formatPrice = (price) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };
  
  // 🔒 SECURITY: Calculate percentage based on actual usage
  const percentageUsed = userQuota.totalMinutes > 0 
    ? (userQuota.usedMinutes / userQuota.totalMinutes) * 100 
    : 0;
  
  // Handle plan selection and open checkout
  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  // 🔒 SECURITY: Handle checkout completion with quota refresh
  const handleCheckoutComplete = async () => {
    if (selectedPlan) {
      // Wait a moment for the database to update, then refresh quota
      setTimeout(async () => {
        await refreshQuotaData();
        
        // Close checkout modal
        setShowCheckout(false);
        
        // Show success message
        alert(`🎮 ${selectedPlan.time} minutes added to your gaming quota!`);
        
        // Clear selected plan
        setSelectedPlan(null);
      }, 1000);
    }
  };

  // Handle checkout cancel
  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  // 🔒 SECURITY: Format time display with real-time support
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // 🔒 SECURITY: Format gaming time for sidebar
  const formatGamingTime = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // 🔒 SECURITY: Format seconds to minutes and seconds for display
  const formatSecondsDisplay = (seconds) => {
    if (seconds <= 0) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes === 0) {
      return `${secs}s`;
    } else if (minutes < 60) {
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m ${secs}s`;
    }
  };

  // Get current display time (either static minutes or real-time seconds)
  const getCurrentDisplayTime = () => {
    if (isGaming) {
      return formatSecondsDisplay(displayTime);
    } else {
      return Math.max(0, userQuota.remainingMinutes);
    }
  };

  // Custom styles
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
    quotaSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "3rem"
    },
    quotaCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      width: "100%",
      maxWidth: "400px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    },
    lowQuotaWarning: {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      border: "1px solid #F59E0B",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      marginBottom: "1rem",
      textAlign: "center",
      width: "100%"
    },
    warningText: {
      color: "#F59E0B",
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    noQuotaWarning: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid #EF4444",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      marginBottom: "1rem",
      textAlign: "center",
      width: "100%"
    },
    noQuotaText: {
      color: "#EF4444",
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    progressContainer: {
      position: "relative",
      width: "180px",
      height: "180px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "1.5rem"
    },
    progressBackground: {
      position: "absolute",
      width: "160px",
      height: "160px",
      borderRadius: "50%",
      background: "#374151"
    },
    progressBar: {
      position: "absolute",
      width: "160px",
      height: "160px",
      borderRadius: "50%",
      background: `conic-gradient(#10B981 ${percentageUsed}%, #374151 0%)`,
      transform: "rotate(-90deg)"
    },
    progressInner: {
      position: "absolute",
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      background: "#1F2937",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    },
    timeDisplay: {
      fontSize: isGaming ? "1.5rem" : "2rem",
      fontWeight: "700",
      color: (userQuota.remainingMinutes <= 5 || displayTime <= 300) ? "#EF4444" : "white",
      textAlign: "center",
      lineHeight: "1.2"
    },
    minutesLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF",
      textAlign: "center"
    },
    gamingIndicator: {
      fontSize: "0.75rem",
      color: "#10B981",
      fontWeight: "600",
      marginTop: "0.25rem"
    },
    timeDetails: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      padding: "1rem 0.5rem",
      borderTop: "1px solid #374151",
      marginTop: "1rem"
    },
    timeInfo: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    timeValue: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#10B981"
    },
    timeLabel: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    // 🔒 SECURITY: Auto-status indicator instead of manual controls
    autoStatusContainer: {
      width: "100%",
      marginTop: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem"
    },
    statusIndicator: {
      width: "100%",
      padding: "0.75rem",
      borderRadius: "0.5rem",
      textAlign: "center",
      fontSize: "0.875rem",
      fontWeight: "600",
      border: "2px solid",
      backgroundColor: isGaming ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
      borderColor: isGaming ? "#10B981" : "#6B7280",
      color: isGaming ? "#10B981" : "#9CA3AF"
    },
    securityNotice: {
      width: "100%",
      padding: "0.5rem",
      borderRadius: "0.375rem",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      border: "1px solid #3B82F6",
      textAlign: "center",
      fontSize: "0.75rem",
      color: "#93C5FD"
    },
    plansSection: {
      width: "100%"
    },
    plansHeading: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1.5rem",
      textAlign: "center"
    },
    plansGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: "1.5rem"
    },
    planCard: {
      backgroundColor: "#1F2937",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
      border: "1px solid #374151"
    },
    planCardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3)",
      borderColor: "#10B981"
    },
    planIcon: {
      fontSize: "2.5rem",
      marginBottom: "1rem"
    },
    planName: {
      fontSize: "1.25rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      color: "white"
    },
    planPrice: {
      fontSize: "1.125rem",
      fontWeight: "700",
      color: "#10B981",
      marginBottom: "0.5rem"
    },
    planDescription: {
      color: "#9CA3AF",
      textAlign: "center",
      marginBottom: "1.5rem"
    },
    buyButton: {
      backgroundColor: "#10B981",
      color: "white",
      padding: "0.5rem 1.5rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    buyButtonHover: {
      backgroundColor: "#059669"
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <h1 style={styles.heading}>Your Gaming Quota</h1>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading your gaming quota...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <h1 style={styles.heading}>Your Gaming Quota</h1>
        
        {/* Error message */}
        {error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        
        {/* Quota Display Section with Auto Timer */}
        <div style={styles.quotaSection}>
          <div style={styles.quotaCard}>
            {/* 🔒 SECURITY: Low quota warnings */}
            {userQuota.remainingMinutes <= 0 && (
              <div style={styles.noQuotaWarning}>
                <p style={styles.noQuotaText}>
                  ⚠️ No gaming time remaining! Purchase more time to continue playing.
                </p>
              </div>
            )}
            
            {userQuota.remainingMinutes > 0 && userQuota.remainingMinutes <= 30 && (
              <div style={styles.lowQuotaWarning}>
                <p style={styles.warningText}>
                  ⚠️ Low gaming time! Only {userQuota.remainingMinutes} minutes remaining.
                </p>
              </div>
            )}

            <div style={styles.progressContainer}>
              <div style={styles.progressBackground}></div>
              <div style={styles.progressBar}></div>
              <div style={styles.progressInner}>
                <span style={styles.timeDisplay}>
                  {getCurrentDisplayTime()}
                </span>
                <span style={styles.minutesLabel}>
                  {isGaming ? "time remaining" : "minutes left"}
                </span>
                {isGaming && (
                  <span style={styles.gamingIndicator}>
                    ⏱️ GAMING
                  </span>
                )}
              </div>
            </div>
            
            <div style={styles.timeDetails}>
              <div style={styles.timeInfo}>
                <span style={styles.timeValue}>{userQuota.usedMinutes}</span>
                <span style={styles.timeLabel}>Used</span>
              </div>
              <div style={styles.timeInfo}>
                <span style={styles.timeValue}>{userQuota.totalMinutes}</span>
                <span style={styles.timeLabel}>Total</span>
              </div>
              <div style={styles.timeInfo}>
                <span style={styles.timeValue}>{Math.round(percentageUsed)}%</span>
                <span style={styles.timeLabel}>Used</span>
              </div>
            </div>

            {/* 🔒 SECURITY: Auto-status indicator - NO MANUAL CONTROLS */}
            <div style={styles.autoStatusContainer}>
              <div style={styles.statusIndicator}>
                {isGaming ? (
                  <>🎮 Gaming Session Active - Timer Running Automatically</>
                ) : (
                  <>⏸️ No Gaming Time Available - Purchase More Time</>
                )}
              </div>
              
              <div style={styles.securityNotice}>
                🔒 Timer runs automatically when you have available time
              </div>
            </div>
          </div>
        </div>
        
        {/* Plans Section */}
        <div style={styles.plansSection}>
          <h2 style={styles.plansHeading}>Purchase More Gaming Time</h2>
          
          <div style={styles.plansGrid}>
            {quotaPlans.map((plan) => (
              <div 
                key={plan.id} 
                style={styles.planCard}
                onClick={() => handlePurchase(plan)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = styles.planCardHover.transform;
                  e.currentTarget.style.boxShadow = styles.planCardHover.boxShadow;
                  e.currentTarget.style.borderColor = styles.planCardHover.borderColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#374151";
                }}
              >
                <div style={styles.planIcon}>{plan.icon}</div>
                <h3 style={styles.planName}>{plan.name}</h3>
                <p style={styles.planPrice}>{formatPrice(plan.price)}</p>
                <p style={styles.planDescription}>
                  Add {formatTime(plan.time)} to your gaming session
                </p>
                <button 
                  style={styles.buyButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.buyButtonHover.backgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = styles.buyButton.backgroundColor;
                  }}
                >
                  Purchase
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🔒 SECURITY: Enhanced Checkout with proper item data */}
        {showCheckout && selectedPlan && (
          <CheckoutPage
            items={[
              {
                name: selectedPlan.name,
                price: selectedPlan.price,
                minutes: selectedPlan.minutes,
                quantity: 1,
                description: `${formatTime(selectedPlan.time)} of gaming time`
              }
            ]}
            totalAmount={selectedPlan.price}
            onCancel={handleCheckoutCancel}
            onComplete={handleCheckoutComplete}
            checkoutType="quota"
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