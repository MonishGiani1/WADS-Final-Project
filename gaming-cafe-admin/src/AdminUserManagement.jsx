import { useState, useEffect } from "react";

export default function AdminUserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, edit, create
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real users from MongoDB
  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  // Admin server configuration - same as reports
  const getAdminApiBase = () => {
    try {
      return process.env.REACT_APP_ADMIN_API_URL || 'https://admin-backend1.up.railway.app';
    } catch (error) {
      return 'https://admin-backend1.up.railway.app';
    }
  };
  const ADMIN_API_BASE = getAdminApiBase();

  // Load users from MongoDB
  useEffect(() => {
    loadUsers();
    loadActiveSessions();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin authentication required. Please login again.');
        return;
      }

      console.log('🔍 Fetching users from admin server...');
      const response = await fetch(`${ADMIN_API_BASE}https://admin-backend1.up.railway.app/api/admin/users`, {
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
        console.log('✅ Users loaded successfully:', data);
        
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          setError('Invalid response format from server');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to load users (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Failed to connect to admin server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      // This would connect to your gaming session system
      // For now, we'll use mock data since you might not have session tracking yet
      const mockSessions = [
        {
          id: "SES-001",
          userId: "64f1234567890123456789ab", // MongoDB ObjectId format
          userName: "John Doe",
          station: "PC-05",
          game: "Valorant",
          startTime: "14:30",
          duration: "2h 15m",
          timeRemaining: "2h 15m",
          cost: "Rp 45,000",
          status: "active"
        }
      ];
      setActiveSessions(mockSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Filter users based on search and status
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user._id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || user.isActive === (filterStatus === "active");
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get user counts by status
  const getUserCounts = () => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      suspended: 0, // You can add a suspended field to your user schema
      online: activeSessions.length
    };
  };

  // Handle user status change
  const handleStatusChange = async (userId, newStatus) => {
    const isActive = newStatus === "active";
    
    if (window.confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`)) {
      setIsLoading(true);
      
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          alert("❌ Admin authentication required");
          setIsLoading(false);
          return;
        }

        console.log(`🔄 Updating user ${userId} status to ${newStatus}...`);
        const response = await fetch(`${ADMIN_API_BASE}https://admin-backend1.up.railway.app/api/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isActive })
        });

        if (response.status === 401) {
          alert("❌ Admin session expired. Please login again.");
          localStorage.removeItem('adminToken');
          setIsLoading(false);
          return;
        }

        if (response.ok) {
          const result = await response.json();
          console.log('✅ User status updated successfully:', result);
          
          // Update local state
          setUsers(prev => prev.map(user => 
            user._id === userId 
              ? { ...user, isActive }
              : user
          ));
          
          // Update selected user if it's the one being changed
          if (selectedUser?._id === userId) {
            setSelectedUser(prev => ({
              ...prev,
              isActive
            }));
          }
          
          alert(`✅ User ${isActive ? 'activated' : 'deactivated'} successfully`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(`❌ Failed to update user status: ${errorData.error || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.error('❌ Error updating user status:', error);
        alert("❌ Failed to update user status. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle ending user session
  const handleEndSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to end this user's session?")) {
      setIsLoading(true);
      
      try {
        // TODO: Implement session management API
        // const response = await fetch(`${ADMIN_API_BASE}https://admin-backend1.up.railway.app/api/admin/sessions/${sessionId}/end`, {
        //   method: 'POST',
        //   headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        // });

        // For now, just remove from local state
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
        alert("✅ Session ended successfully");
        
      } catch (error) {
        alert("❌ Failed to end session");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle adding balance to user (you'd need to add balance field to user schema)
  const handleAddBalance = async (userId) => {
    const amount = prompt("Enter amount to add (in Rupiah):");
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
      setIsLoading(true);
      
      try {
        // TODO: Implement balance management API
        // const response = await fetch(`${ADMIN_API_BASE}https://admin-backend1.up.railway.app/api/admin/users/${userId}/balance`, {
        //   method: 'PATCH',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        //   },
        //   body: JSON.stringify({ amount: parseInt(amount) })
        // });

        alert(`✅ Balance management feature will be implemented soon`);
        
      } catch (error) {
        alert("❌ Failed to add balance");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time since registration
  const getTimeSinceRegistration = (createdDate) => {
    if (!createdDate) return 'Unknown';
    const now = new Date();
    const created = new Date(createdDate);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
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

    // Stats Cards
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
      gap: "0.5rem",
      marginBottom: "2rem"
    },
    tab: {
      padding: "1rem 2rem",
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

    // Table
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
      borderBottom: "1px solid #4B5563"
    },
    td: {
      padding: "1rem",
      borderBottom: "1px solid #374151",
      fontSize: "0.875rem",
      verticalAlign: "top"
    },
    userRow: {
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    },
    userAvatar: {
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "50%",
      backgroundColor: "#DC2626",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "600"
    },
    userDetails: {
      display: "flex",
      flexDirection: "column"
    },
    userName: {
      fontWeight: "600",
      color: "white"
    },
    userEmail: {
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
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap"
    },
    smallButton: {
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "none",
      fontSize: "0.75rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    
    // User Detail Modal
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
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? "#10B981" : "#6B7280";
  };

  const filteredUsers = getFilteredUsers();
  const userCounts = getUserCounts();

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#9CA3AF" }}>Loading users from admin server...</p>
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

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={loadUsers}
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

  const renderUsersTab = () => (
    <>
      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#3B82F6"}}>{userCounts.total}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#10B981"}}>{userCounts.active}</div>
          <div style={styles.statLabel}>Active Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#F59E0B"}}>{userCounts.online}</div>
          <div style={styles.statLabel}>Currently Online</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#EF4444"}}>{userCounts.suspended}</div>
          <div style={styles.statLabel}>Suspended</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#6B7280"}}>{userCounts.inactive}</div>
          <div style={styles.statLabel}>Inactive</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.leftFilters}>
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div style={styles.rightActions}>
          <button 
            onClick={loadUsers}
            style={{...styles.button, backgroundColor: "#3B82F6", color: "white"}}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Registration</th>
              <th style={styles.th}>Last Login</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr 
                key={user._id} 
                style={styles.userRow}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#374151"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <td style={styles.td}>
                  <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                      {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={styles.userDetails}>
                      <div style={styles.userName}>{user.fullName}</div>
                      <div style={styles.userEmail}>{user.email}</div>
                      <div style={styles.userEmail}>ID: {user._id.slice(-8)}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(user.isActive),
                    color: "white"
                  }}>
                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{color: "#D1D5DB"}}>
                    {user.phoneNumber || 'Not provided'}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{color: "#D1D5DB"}}>
                    {formatDate(user.created)}
                  </div>
                  <div style={styles.userEmail}>
                    {getTimeSinceRegistration(user.created)}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{color: user.lastLogin ? "#10B981" : "#6B7280"}}>
                    {formatDate(user.lastLogin)}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => setSelectedUser(user)}
                      style={{
                        ...styles.smallButton,
                        backgroundColor: "#3B82F6",
                        color: "white"
                      }}
                    >
                      👁️ View
                    </button>
                    
                    {user.isActive ? (
                      <button
                        onClick={() => handleStatusChange(user._id, "inactive")}
                        style={{
                          ...styles.smallButton,
                          backgroundColor: "#EF4444",
                          color: "white"
                        }}
                      >
                        🚫 Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user._id, "active")}
                        style={{
                          ...styles.smallButton,
                          backgroundColor: "#10B981",
                          color: "white"
                        }}
                      >
                        ✅ Activate
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAddBalance(user._id)}
                      style={{
                        ...styles.smallButton,
                        backgroundColor: "#F59E0B",
                        color: "white"
                      }}
                    >
                      💰 Balance
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{textAlign: "center", padding: "2rem", color: "#9CA3AF"}}>
            No users match your current filters.
          </div>
        )}
      </div>
    </>
  );

  const renderSessionsTab = () => (
    <>
      {/* Active Sessions Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Station</th>
              <th style={styles.th}>Game</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>Time Remaining</th>
              <th style={styles.th}>Cost</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeSessions.map((session) => (
              <tr key={session.id}>
                <td style={styles.td}>
                  <div style={styles.userName}>{session.userName}</div>
                  <div style={styles.userEmail}>ID: {session.userId.slice(-8)}</div>
                </td>
                <td style={styles.td}>
                  <span style={{color: "#10B981", fontWeight: "600"}}>
                    {session.station}
                  </span>
                </td>
                <td style={styles.td}>{session.game}</td>
                <td style={styles.td}>{session.duration}</td>
                <td style={styles.td}>
                  <span style={{color: "#F59E0B", fontWeight: "600"}}>
                    {session.timeRemaining}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{color: "#3B82F6", fontWeight: "600"}}>
                    {session.cost}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEndSession(session.id)}
                    style={{
                      ...styles.smallButton,
                      backgroundColor: "#EF4444",
                      color: "white"
                    }}
                  >
                    🛑 End Session
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {activeSessions.length === 0 && (
          <div style={{textAlign: "center", padding: "2rem", color: "#9CA3AF"}}>
            No active sessions at the moment.
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <p style={styles.subtitle}>
          Manage user accounts, active sessions, and access controls
        </p>
        
        {/* Connection status */}
        <div style={styles.connectionStatus}>
          <p style={styles.connectionText}>
            ✅ Connected to Admin Server ({ADMIN_API_BASE})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "users" ? styles.tabActive : styles.tabInactive)
          }}
          onClick={() => setActiveTab("users")}
        >
          👥 User Accounts ({users.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "sessions" ? styles.tabActive : styles.tabInactive)
          }}
          onClick={() => setActiveTab("sessions")}
        >
          🎮 Active Sessions ({activeSessions.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && renderUsersTab()}
      {activeTab === "sessions" && renderSessionsTab()}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={styles.modal} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>User Details: {selectedUser.fullName}</h2>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            
            <div style={{display: "grid", gap: "1rem"}}>
              <div><strong>Full Name:</strong> {selectedUser.fullName}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Phone:</strong> {selectedUser.phoneNumber || 'Not provided'}</div>
              <div><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
              <div><strong>User ID:</strong> {selectedUser._id}</div>
              <div><strong>Gaming Quota:</strong> {selectedUser.gamingQuotaMinutes || 0} minutes</div>
              <div><strong>Total Spent:</strong> Rp {(selectedUser.totalSpent || 0).toLocaleString('id-ID')}</div>
              <div><strong>Membership Level:</strong> {selectedUser.membershipLevel || 'Bronze'}</div>
              <div><strong>Loyalty Points:</strong> {selectedUser.loyaltyPoints || 0} points</div>
              <div><strong>Registration Date:</strong> {formatDate(selectedUser.created)}</div>
              <div><strong>Last Login:</strong> {formatDate(selectedUser.lastLogin)}</div>
              <div><strong>Account Age:</strong> {getTimeSinceRegistration(selectedUser.created)}</div>
            </div>

            <div style={{marginTop: "2rem", display: "flex", gap: "1rem"}}>
              <button
                onClick={() => handleStatusChange(selectedUser._id, selectedUser.isActive ? "inactive" : "active")}
                style={{
                  ...styles.button,
                  backgroundColor: selectedUser.isActive ? "#EF4444" : "#10B981",
                  color: "white"
                }}
              >
                {selectedUser.isActive ? "🚫 Deactivate" : "✅ Activate"}
              </button>
              <button
                onClick={() => handleAddBalance(selectedUser._id)}
                style={{
                  ...styles.button,
                  backgroundColor: "#F59E0B",
                  color: "white"
                }}
              >
                💰 Manage Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}