import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [reportForm, setReportForm] = useState({
    category: "technical",
    priority: "medium",
    title: "",
    description: "",
    station: "",
    attachments: []
  });
  const [userReports, setUserReports] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user info from localStorage (from login)
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userInfo.email || 'guest@ichi.com';
  const userName = userInfo.fullName || 'Guest User';
  const userId = userInfo.id || null;

  // Load user's reports when component mounts or tab changes to history
  useEffect(() => {
    if (activeTab === "history" && userEmail !== 'guest@ichi.com') {
      loadUserReports();
    }
  }, [activeTab, userEmail]);

  // Load user's reports from backend
  const loadUserReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://user-backend.up.railway.app/api/reports/user/${encodeURIComponent(userEmail)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserReports(data.reports || []);
      } else {
        setError('Failed to load your reports');
      }
    } catch (error) {
      console.error('Error loading user reports:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Report categories
  const categories = [
    { id: "technical", name: "Technical Issue", icon: "🔧", description: "Hardware, software, or connectivity problems" },
    { id: "food", name: "Food & Service", icon: "🍔", description: "Food orders, quality, or service issues" },
    { id: "environment", name: "Environment", icon: "🏢", description: "Noise, temperature, cleanliness concerns" },
    { id: "billing", name: "Billing", icon: "💳", description: "Payment or pricing questions" },
    { id: "other", name: "Other", icon: "❓", description: "Any other concerns or feedback" }
  ];

  // Priority levels
  const priorities = [
    { id: "low", name: "Low", color: "#10B981", description: "Minor issue, can wait" },
    { id: "medium", name: "Medium", color: "#F59E0B", description: "Moderate issue, needs attention" },
    { id: "high", name: "High", color: "#EF4444", description: "Urgent issue, requires immediate help" }
  ];

  // Status colors
  const statusColors = {
    pending: "#F59E0B",
    investigating: "#3B82F6", 
    resolved: "#10B981",
    escalated: "#EF4444",
    closed: "#6B7280"
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (userEmail === 'guest@ichi.com') {
      alert("Please log in to submit a report");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://user-backend.up.railway.app/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...reportForm,
          userEmail,
          userName,
          userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Reset form
        setReportForm({
          category: "technical",
          priority: "medium", 
          title: "",
          description: "",
          station: "",
          attachments: []
        });

        alert(`✅ Report submitted successfully! Report ID: ${data.report.id}`);
        setActiveTab("history");
        
        // Reload user reports
        setTimeout(() => {
          loadUserReports();
        }, 500);
        
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to submit report: ${errorData.message}`);
      }
      
    } catch (error) {
      console.error('Error submitting report:', error);
      alert("❌ Failed to submit report. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
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
    
    // Login notice
    loginNotice: {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      border: "1px solid #F59E0B",
      borderRadius: "0.5rem",
      padding: "1rem",
      marginBottom: "2rem",
      textAlign: "center"
    },
    noticeText: {
      color: "#FCD34D",
      fontSize: "0.875rem"
    },

    // Loading states
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
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
      fontSize: "1.125rem"
    },
    
    // Tabs
    tabsContainer: {
      display: "flex",
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "0.5rem",
      marginBottom: "2rem",
      gap: "0.5rem"
    },
    tab: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      padding: "1rem",
      borderRadius: "0.75rem",
      cursor: "pointer",
      transition: "all 0.2s",
      fontSize: "0.875rem",
      fontWeight: "500"
    },
    tabActive: {
      backgroundColor: "#10B981",
      color: "white"
    },
    tabInactive: {
      color: "#9CA3AF",
      backgroundColor: "transparent"
    },

    // Form styles
    formContainer: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      border: "1px solid #374151"
    },
    formGrid: {
      display: "grid",
      gap: "1.5rem"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    },
    label: {
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#D1D5DB"
    },
    required: {
      color: "#EF4444"
    },
    input: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#111827",
      color: "white",
      fontSize: "0.875rem",
      transition: "border-color 0.2s"
    },
    textarea: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#111827",
      color: "white",
      fontSize: "0.875rem",
      minHeight: "120px",
      resize: "vertical",
      fontFamily: "inherit"
    },

    // Category grid
    categoryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem"
    },
    categoryCard: {
      padding: "1rem",
      borderRadius: "0.75rem",
      border: "2px solid #374151",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "center"
    },
    categoryCardActive: {
      borderColor: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.1)"
    },
    categoryIcon: {
      fontSize: "2rem",
      marginBottom: "0.5rem"
    },
    categoryName: {
      fontSize: "0.875rem",
      fontWeight: "600",
      marginBottom: "0.25rem"
    },
    categoryDesc: {
      fontSize: "0.75rem",
      color: "#9CA3AF"
    },

    // Priority selector
    priorityGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem"
    },
    priorityCard: {
      padding: "1rem",
      borderRadius: "0.75rem",
      border: "2px solid #374151",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "center"
    },

    // Submit button
    submitButton: {
      padding: "1rem 2rem",
      borderRadius: "0.75rem",
      border: "none",
      backgroundColor: "#10B981",
      color: "white",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem"
    },
    submitButtonDisabled: {
      backgroundColor: "#6B7280",
      cursor: "not-allowed"
    },

    // Reports list
    reportsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    },
    reportCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid #374151"
    },
    reportHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem"
    },
    reportTitle: {
      fontSize: "1.125rem",
      fontWeight: "600",
      marginBottom: "0.5rem"
    },
    reportMeta: {
      display: "flex",
      gap: "1rem",
      fontSize: "0.75rem",
      color: "#9CA3AF"
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      textTransform: "uppercase"
    },
    priorityBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500"
    },
    reportResponse: {
      marginTop: "1rem",
      padding: "1rem",
      backgroundColor: "#111827",
      borderRadius: "0.5rem",
      borderLeft: "4px solid #10B981"
    },
    responseLabel: {
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#10B981",
      marginBottom: "0.5rem"
    },

    // Help section
    helpContainer: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      border: "1px solid #374151"
    },
    helpGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1.5rem",
      marginTop: "1.5rem"
    },
    helpCard: {
      padding: "1.5rem",
      backgroundColor: "#111827",
      borderRadius: "0.75rem",
      textAlign: "center"
    },
    helpIcon: {
      fontSize: "2.5rem",
      marginBottom: "1rem"
    },
    helpTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "0.5rem"
    },
    helpDesc: {
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },

    submitSpinner: {
      width: "20px",
      height: "20px",
      border: "2px solid #374151",
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

  const renderSubmitForm = () => (
    <>
      {userEmail === 'guest@ichi.com' && (
        <div style={styles.loginNotice}>
          <p style={styles.noticeText}>
            ⚠️ Please log in to submit a report. Guest users cannot submit reports.
          </p>
        </div>
      )}
      
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmitReport} style={styles.formGrid}>
          {/* User Info Display */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Submitting as:</label>
            <div style={{color: "#10B981", fontWeight: "600"}}>
              {userName} ({userEmail})
            </div>
          </div>

          {/* Category Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Report Category <span style={styles.required}>*</span>
            </label>
            <div style={styles.categoryGrid}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    ...styles.categoryCard,
                    ...(reportForm.category === category.id ? styles.categoryCardActive : {})
                  }}
                  onClick={() => handleInputChange("category", category.id)}
                >
                  <div style={styles.categoryIcon}>{category.icon}</div>
                  <div style={styles.categoryName}>{category.name}</div>
                  <div style={styles.categoryDesc}>{category.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Priority Level <span style={styles.required}>*</span>
            </label>
            <div style={styles.priorityGrid}>
              {priorities.map((priority) => (
                <div
                  key={priority.id}
                  style={{
                    ...styles.priorityCard,
                    borderColor: reportForm.priority === priority.id ? priority.color : "#374151",
                    backgroundColor: reportForm.priority === priority.id ? `${priority.color}20` : "transparent"
                  }}
                  onClick={() => handleInputChange("priority", priority.id)}
                >
                  <div style={{...styles.categoryName, color: priority.color}}>
                    {priority.name}
                  </div>
                  <div style={styles.categoryDesc}>{priority.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Issue Title <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={reportForm.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Brief description of the issue"
              style={styles.input}
              required
            />
          </div>

          {/* Station */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Station Number</label>
            <input
              type="text"
              value={reportForm.station}
              onChange={(e) => handleInputChange("station", e.target.value)}
              placeholder="e.g., PC-05 (if applicable)"
              style={styles.input}
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Detailed Description <span style={styles.required}>*</span>
            </label>
            <textarea
              value={reportForm.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Please provide as much detail as possible about the issue..."
              style={styles.textarea}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || userEmail === 'guest@ichi.com'}
            style={{
              ...styles.submitButton,
              ...(isSubmitting || userEmail === 'guest@ichi.com' ? styles.submitButtonDisabled : {})
            }}
          >
            {isSubmitting ? (
              <>
                <div style={styles.submitSpinner} />
                Submitting Report...
              </>
            ) : userEmail === 'guest@ichi.com' ? (
              <>
                🚫 Login Required
              </>
            ) : (
              <>
                📝 Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );

  const renderReportsHistory = () => {
    if (userEmail === 'guest@ichi.com') {
      return (
        <div style={styles.loginNotice}>
          <p style={styles.noticeText}>
            ⚠️ Please log in to view your report history.
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#9CA3AF" }}>Loading your reports...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={loadUserReports}
            style={{...styles.submitButton, marginTop: "1rem"}}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div style={styles.reportsList}>
        {userReports.map((report) => (
          <div key={report.id} style={styles.reportCard}>
            <div style={styles.reportHeader}>
              <div>
                <div style={styles.reportTitle}>{report.title}</div>
                <div style={styles.reportMeta}>
                  <span>#{report.id}</span>
                  <span>📅 {report.submittedAt}</span>
                  {report.station && <span>🖥️ {report.station}</span>}
                </div>
              </div>
              <div style={{display: "flex", gap: "0.5rem"}}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[report.status],
                    color: "white"
                  }}
                >
                  {report.status}
                </span>
                <span
                  style={{
                    ...styles.priorityBadge,
                    backgroundColor: priorities.find(p => p.id === report.priority)?.color,
                    color: "white"
                  }}
                >
                  {report.priority} priority
                </span>
              </div>
            </div>

            {report.response && (
              <div style={styles.reportResponse}>
                <div style={styles.responseLabel}>📞 Staff Response:</div>
                <div>{report.response}</div>
              </div>
            )}
          </div>
        ))}

        {userReports.length === 0 && !isLoading && (
          <div style={{textAlign: "center", padding: "2rem", color: "#9CA3AF"}}>
            No reports submitted yet. Submit your first report above!
          </div>
        )}
      </div>
    );
  };

  const renderHelp = () => (
    <div style={styles.helpContainer}>
      <h2 style={{fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem"}}>
        Need Help?
      </h2>
      <p style={{color: "#9CA3AF", marginBottom: "1.5rem"}}>
        Here are some quick solutions for common issues:
      </p>

      <div style={styles.helpGrid}>
        <div style={styles.helpCard}>
          <div style={styles.helpIcon}>🔧</div>
          <div style={styles.helpTitle}>Technical Issues</div>
          <div style={styles.helpDesc}>
            Try restarting your game or refreshing the browser. Check cables and connections.
          </div>
        </div>

        <div style={styles.helpCard}>
          <div style={styles.helpIcon}>🍔</div>
          <div style={styles.helpTitle}>Food Orders</div>
          <div style={styles.helpDesc}>
            Check your order status in the Food section. Contact staff if items are missing.
          </div>
        </div>

        <div style={styles.helpCard}>
          <div style={styles.helpIcon}>💳</div>
          <div style={styles.helpTitle}>Payment Issues</div>
          <div style={styles.helpDesc}>
            Verify your payment method and check if charges went through in your bank app.
          </div>
        </div>

        <div style={styles.helpCard}>
          <div style={styles.helpIcon}>📞</div>
          <div style={styles.helpTitle}>Emergency</div>
          <div style={styles.helpDesc}>
            For urgent issues, press the call button on your station or approach the front desk.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Report an Issue</h1>
        <p style={styles.subtitle}>
          Having trouble? Let us know and we'll help you right away
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === "submit" ? styles.tabActive : styles.tabInactive)
          }}
          onClick={() => setActiveTab("submit")}
        >
          <span>📝</span>
          <span>Submit Report</span>
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === "history" ? styles.tabActive : styles.tabInactive)
          }}
          onClick={() => setActiveTab("history")}
        >
          <span>📋</span>
          <span>My Reports ({userReports.length})</span>
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === "help" ? styles.tabActive : styles.tabInactive)
          }}
          onClick={() => setActiveTab("help")}
        >
          <span>❓</span>
          <span>Quick Help</span>
        </div>
      </div>

      {/* Content */}
      {activeTab === "submit" && renderSubmitForm()}
      {activeTab === "history" && renderReportsHistory()}
      {activeTab === "help" && renderHelp()}
    </div>
  );
}