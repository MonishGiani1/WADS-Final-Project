import { useState, useEffect } from "react";

export default function AdminUserReports() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportStats, setReportStats] = useState({
    pending: 0,
    investigating: 0,
    resolved: 0,
    escalated: 0,
    total: 0
  });

  // Admin server configuration - fallback for browser environment
  const getAdminApiBase = () => {
    try {
      return process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001';
    } catch (error) {
      // Fallback for environments where process is not defined
      return 'http://localhost:5001';
    }
  };
  const ADMIN_API_BASE = getAdminApiBase();

  // Load reports from backend
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin authentication required. Please login again.');
        return;
      }

      console.log('🔍 Fetching reports from admin server...');
      const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/reports`, {
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
        console.log('✅ Reports loaded successfully:', data);
        
        if (data.success && data.reports) {
          setReports(data.reports);
          setReportStats(data.stats || reportStats);
        } else {
          setError('Invalid response format from server');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to load reports (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      setError('Failed to connect to admin server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reports based on status, search, priority, and category
  const getFilteredReports = () => {
    return reports.filter(report => {
      const matchesTab = activeTab === "all" || report.status === activeTab;
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           report.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           report.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
      const matchesCategory = filterCategory === "all" || report.category === filterCategory;
      
      return matchesTab && matchesSearch && matchesPriority && matchesCategory;
    });
  };

  // Handle report status change
  const handleStatusChange = async (reportId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this report status to ${newStatus}?`)) {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          alert("❌ Admin authentication required");
          return;
        }

        console.log(`🔄 Updating report ${reportId} status to ${newStatus}...`);
        const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/reports/${reportId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401) {
          alert("❌ Admin session expired. Please login again.");
          localStorage.removeItem('adminToken');
          return;
        }

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Status updated successfully:', result);
          
          // Update local state
          setReports(prev => prev.map(report => 
            report.id === reportId 
              ? { ...report, status: newStatus, updatedAt: new Date().toLocaleDateString() }
              : report
          ));

          // Update selected report if it's the one being changed
          if (selectedReport?.id === reportId) {
            setSelectedReport(prev => ({
              ...prev,
              status: newStatus,
              updatedAt: new Date().toLocaleDateString()
            }));
          }

          // Reload reports to update stats
          await loadReports();
          alert(`✅ Report status updated to ${newStatus}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(`❌ Failed to update report status: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error updating report status:', error);
        alert("❌ Error updating report status. Please check your connection.");
      }
    }
  };

  // Handle adding response to report
  const handleAddResponse = async (reportId) => {
    if (!responseText.trim()) {
      alert("Please enter a response message.");
      return;
    }

    setIsResponding(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert("❌ Admin authentication required");
        setIsResponding(false);
        return;
      }

      console.log(`💬 Adding response to report ${reportId}...`);
      const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/reports/${reportId}/response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          response: responseText.trim(),
          assignedTo: 'Admin'
        })
      });

      if (response.status === 401) {
        alert("❌ Admin session expired. Please login again.");
        localStorage.removeItem('adminToken');
        setIsResponding(false);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Response added successfully:', result);
        
        // Update local state
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                response: responseText,
                status: 'investigating',
                updatedAt: new Date().toLocaleDateString(),
                assignedTo: 'Admin'
              }
            : report
        ));

        // Update selected report
        if (selectedReport?.id === reportId) {
          setSelectedReport(prev => ({
            ...prev,
            response: responseText,
            status: 'investigating',
            updatedAt: new Date().toLocaleDateString(),
            assignedTo: 'Admin'
          }));
        }

        setResponseText("");
        alert("✅ Response sent successfully!");
        
        // Reload reports to update stats
        await loadReports();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to send response: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error sending response:', error);
      alert("❌ Error sending response. Please check your connection.");
    } finally {
      setIsResponding(false);
    }
  };

  // Handle escalating report
  const handleEscalate = async (reportId) => {
    if (window.confirm("Are you sure you want to escalate this report to management?")) {
      await handleStatusChange(reportId, 'escalated');
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

    // Loading states
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

    // Connection status indicator
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

    // Stats Cards
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
      textAlign: "center"
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

    // Tabs
    tabsContainer: {
      display: "flex",
      overflowX: "auto",
      borderBottom: "1px solid #374151",
      marginBottom: "2rem",
      gap: "0.5rem"
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
      fontWeight: "500",
      borderRadius: "0.5rem 0.5rem 0 0"
    },
    tabActive: {
      borderBottomColor: "#EF4444",
      backgroundColor: "#7F1D1D",
      color: "#FCA5A5"
    },
    tabInactive: {
      color: "#9CA3AF",
      backgroundColor: "#374151"
    },
    tabBadge: {
      backgroundColor: "#DC2626",
      color: "white",
      borderRadius: "9999px",
      padding: "0.25rem 0.5rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      minWidth: "1.5rem",
      textAlign: "center"
    },

    // Filters
    filtersContainer: {
      display: "flex",
      gap: "1rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between"
    },
    leftFilters: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    rightActions: {
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
      width: "300px"
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

    // Reports Layout
    reportsLayout: {
      display: "grid",
      gridTemplateColumns: selectedReport ? "1fr 1fr" : "1fr",
      gap: "2rem",
      height: "calc(100vh - 450px)",
      minHeight: "600px"
    },

    // Reports List
    reportsList: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      border: "1px solid #374151",
      overflow: "hidden"
    },
    reportsHeader: {
      backgroundColor: "#374151",
      padding: "1rem 1.5rem",
      borderBottom: "1px solid #4B5563"
    },
    reportsBody: {
      maxHeight: "600px",
      overflowY: "auto"
    },
    reportItem: {
      padding: "1rem 1.5rem",
      borderBottom: "1px solid #374151",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    reportItemHover: {
      backgroundColor: "#374151"
    },
    reportItemSelected: {
      backgroundColor: "#7F1D1D",
      borderLeft: "4px solid #EF4444"
    },
    reportHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "0.5rem"
    },
    reportTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "white",
      marginBottom: "0.25rem"
    },
    reportMeta: {
      fontSize: "0.75rem",
      color: "#9CA3AF",
      display: "flex",
      gap: "1rem"
    },
    priorityBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      textTransform: "uppercase"
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      textTransform: "uppercase"
    },

    // Report Detail Panel
    reportDetail: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      border: "1px solid #374151",
      padding: "1.5rem",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: "calc(100vh - 450px)",
      minHeight: "600px"
    },
    detailHeader: {
      borderBottom: "1px solid #374151",
      paddingBottom: "1rem",
      marginBottom: "1rem"
    },
    detailTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem"
    },
    detailMeta: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
      marginBottom: "1rem"
    },
    metaItem: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem"
    },
    metaLabel: {
      fontSize: "0.75rem",
      color: "#9CA3AF",
      textTransform: "uppercase",
      fontWeight: "600"
    },
    metaValue: {
      fontSize: "0.875rem",
      color: "white"
    },
    detailContent: {
      flex: 1,
      overflowY: "auto",
      marginBottom: "1rem",
      paddingRight: "0.5rem"
    },
    descriptionSection: {
      marginBottom: "1.5rem"
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "0.5rem",
      color: "#FCA5A5"
    },
    descriptionText: {
      backgroundColor: "#374151",
      padding: "1rem",
      borderRadius: "0.5rem",
      lineHeight: "1.6",
      color: "#D1D5DB"
    },
    responseSection: {
      marginBottom: "1.5rem"
    },
    existingResponse: {
      backgroundColor: "#166534",
      border: "1px solid #16A34A",
      borderRadius: "0.5rem",
      padding: "1rem",
      marginBottom: "1rem"
    },
    responseLabel: {
      fontSize: "0.75rem",
      color: "#4ADE80",
      fontWeight: "600",
      marginBottom: "0.5rem"
    },
    responseText: {
      color: "#D1FAE5"
    },
    responseForm: {
      marginTop: "1rem"
    },
    textarea: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#374151",
      border: "1px solid #4B5563",
      borderRadius: "0.5rem",
      color: "white",
      fontSize: "0.875rem",
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "inherit"
    },
    actionsContainer: {
      borderTop: "1px solid #374151",
      paddingTop: "1rem",
      marginTop: "auto",
      flexShrink: 0,
      backgroundColor: "#1F2937",
      position: "sticky",
      bottom: 0
    },
    actionsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "0.75rem"
    },
    actionButton: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "none",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem"
    },
    primaryActionButton: {
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
    responseSpinner: {
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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#6B7280";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "#F59E0B";
      case "investigating": return "#3B82F6";
      case "resolved": return "#10B981";
      case "escalated": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const filteredReports = getFilteredReports();

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#9CA3AF" }}>Loading reports from admin server...</p>
          <p style={{ color: "#6B7280", fontSize: "0.75rem" }}>Connecting to {ADMIN_API_BASE}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={loadReports}
            style={{...styles.button, ...styles.primaryButton, marginTop: "1rem"}}
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
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>User Reports Management</h1>
        <p style={styles.subtitle}>
          Handle user complaints, issues, and support tickets
        </p>
        
        {/* Connection status */}
        <div style={styles.connectionStatus}>
          <p style={styles.connectionText}>
            ✅ Connected to Admin Server ({ADMIN_API_BASE})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#F59E0B"}}>{reportStats.pending}</div>
          <div style={styles.statLabel}>Pending Reports</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#3B82F6"}}>{reportStats.investigating}</div>
          <div style={styles.statLabel}>Under Investigation</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#10B981"}}>{reportStats.resolved}</div>
          <div style={styles.statLabel}>Resolved</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#EF4444"}}>{reportStats.escalated}</div>
          <div style={styles.statLabel}>Escalated</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: "pending", name: "Pending", count: reportStats.pending },
          { id: "investigating", name: "Investigating", count: reportStats.investigating },
          { id: "resolved", name: "Resolved", count: reportStats.resolved },
          { id: "escalated", name: "Escalated", count: reportStats.escalated },
          { id: "all", name: "All Reports", count: reportStats.total }
        ].map((tab) => (
          <div
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.name}</span>
            <span style={styles.tabBadge}>{tab.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.leftFilters}>
          <input
            type="text"
            placeholder="Search reports, users, or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="food">Food & Service</option>
            <option value="environment">Environment</option>
            <option value="billing">Billing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={styles.rightActions}>
          <button 
            onClick={loadReports}
            style={{...styles.button, backgroundColor: "#3B82F6", color: "white"}}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Reports Layout */}
      <div style={styles.reportsLayout}>
        {/* Reports List */}
        <div style={styles.reportsList}>
          <div style={styles.reportsHeader}>
            <h3 style={{margin: 0, fontWeight: "600"}}>
              {filteredReports.length} Report{filteredReports.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div style={styles.reportsBody}>
            {filteredReports.map((report) => (
              <div
                key={report.id}
                style={{
                  ...styles.reportItem,
                  ...(selectedReport?.id === report.id ? styles.reportItemSelected : {})
                }}
                onClick={() => setSelectedReport(report)}
                onMouseEnter={(e) => {
                  if (selectedReport?.id !== report.id) {
                    e.target.style.backgroundColor = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedReport?.id !== report.id) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div style={styles.reportHeader}>
                  <div>
                    <div style={styles.reportTitle}>{report.title}</div>
                    <div style={styles.reportMeta}>
                      <span>#{report.id}</span>
                      <span>👤 {report.user}</span>
                      <span>🖥️ {report.station || 'N/A'}</span>
                      <span>📅 {report.submittedAt}</span>
                    </div>
                  </div>
                  <div style={{display: "flex", gap: "0.5rem", flexDirection: "column", alignItems: "flex-end"}}>
                    <span
                      style={{
                        ...styles.priorityBadge,
                        backgroundColor: getPriorityColor(report.priority),
                        color: "white"
                      }}
                    >
                      {report.priority}
                    </span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(report.status),
                        color: "white"
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div style={{textAlign: "center", padding: "2rem", color: "#9CA3AF"}}>
                No reports match your current filters.
              </div>
            )}
          </div>
        </div>

        {/* Report Detail Panel */}
        {selectedReport && (
          <div style={styles.reportDetail}>
            <div style={styles.detailHeader}>
              <h2 style={styles.detailTitle}>{selectedReport.title}</h2>
              
              <div style={styles.detailMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Report ID</span>
                  <span style={styles.metaValue}>{selectedReport.id}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>User</span>
                  <span style={styles.metaValue}>{selectedReport.user}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Email</span>
                  <span style={styles.metaValue}>{selectedReport.userEmail}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Station</span>
                  <span style={styles.metaValue}>{selectedReport.station || 'Not specified'}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Category</span>
                  <span style={styles.metaValue}>{selectedReport.category}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Submitted</span>
                  <span style={styles.metaValue}>{selectedReport.submittedAt}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailContent}>
              {/* Description */}
              <div style={styles.descriptionSection}>
                <h3 style={styles.sectionTitle}>Report Description</h3>
                <div style={styles.descriptionText}>
                  {selectedReport.description}
                </div>
              </div>

              {/* Existing Response */}
              {selectedReport.response && (
                <div style={styles.responseSection}>
                  <h3 style={styles.sectionTitle}>Current Response</h3>
                  <div style={styles.existingResponse}>
                    <div style={styles.responseLabel}>
                      Response from {selectedReport.assignedTo || "Admin"}:
                    </div>
                    <div style={styles.responseText}>
                      {selectedReport.response}
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Update Response */}
              <div style={styles.responseSection}>
                <h3 style={styles.sectionTitle}>
                  {selectedReport.response ? "Update Response" : "Add Response"}
                </h3>
                <div style={styles.responseForm}>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response to the user..."
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actionsContainer}>
              <div style={styles.actionsGrid}>
                <button
                  onClick={() => handleAddResponse(selectedReport.id)}
                  disabled={isResponding}
                  style={{...styles.actionButton, ...styles.primaryActionButton}}
                >
                  {isResponding ? (
                    <>
                      <div style={styles.responseSpinner}></div>
                      Sending...
                    </>
                  ) : (
                    "💬 Send Response"
                  )}
                </button>

                <button
                  onClick={() => handleStatusChange(selectedReport.id, "investigating")}
                  style={{...styles.actionButton, ...styles.secondaryButton}}
                >
                  🔍 Mark Investigating
                </button>

                <button
                  onClick={() => handleStatusChange(selectedReport.id, "resolved")}
                  style={{...styles.actionButton, ...styles.successButton}}
                >
                  ✅ Mark Resolved
                </button>

                <button
                  onClick={() => handleEscalate(selectedReport.id)}
                  style={{...styles.actionButton, ...styles.warningButton}}
                >
                  ⚠️ Escalate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}