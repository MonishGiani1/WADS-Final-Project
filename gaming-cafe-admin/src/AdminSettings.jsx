import { useState, useEffect } from "react";

export default function AdminSettings() {
  // Admin server configuration
  const getAdminApiBase = () => {
    try {
      return process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001';
    } catch (error) {
      return 'http://localhost:5001';
    }
  };
  const ADMIN_API_BASE = getAdminApiBase();

  // Initial admin state
  const [admin, setAdmin] = useState({
    fullName: "Administrator",
    email: "admin@ichigaming.com",
    phoneNumber: "+62 812-1234-5678",
    role: "System Administrator",
    permissions: ["full_access", "user_management", "system_control", "financial_reports"],
    lastLogin: "2025-01-22 14:30",
    loginAttempts: 0
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    cafeName: "ICHI Gaming Cafe",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    hourlyRate: 20000,
    foodTax: 11,
    autoLogout: 30,
    maxLoginAttempts: 3,
    sessionTimeout: 60,
    backupFrequency: "daily",
    maintenanceMode: false,
    notifications: {
      email: true,
      sms: false,
      desktop: true,
      lowBalance: true,
      systemAlerts: true,
      userReports: true
    }
  });

  // Form data state
  const [formData, setFormData] = useState({
    fullName: admin.fullName,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    ...systemSettings
  });

  // State management
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [hoveredButton, setHoveredButton] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load admin profile on component mount
  useEffect(() => {
    loadAdminProfile();
  }, []);

  // Load admin profile from server
  const loadAdminProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin authentication required. Please login again.');
        return;
      }

      console.log('Loading admin profile...');
      // For now, use the mock data since admin profile endpoint might not exist yet
      // TODO: Implement actual API call when endpoint is ready
      // const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/profile`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
    } catch (error) {
      console.error('Error loading admin profile:', error);
      setError('Failed to load admin profile');
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData({ ...formData, [name]: newValue });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Handle notification changes
  const handleNotificationChange = (key) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [key]: !formData.notifications[key]
      }
    });
  };

  // Handle admin profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validation
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setErrors({ general: "Admin authentication required" });
        setIsLoading(false);
        return;
      }

      console.log('Updating admin profile...');
      // TODO: Implement actual API call when endpoint is ready
      // const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/profile`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     fullName: formData.fullName,
      //     email: formData.email,
      //     phoneNumber: formData.phoneNumber
      //   })
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAdmin({
        ...admin,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });
      
      setSuccessMessage("Admin profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: "Failed to update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setErrors({ general: "Admin authentication required" });
        setIsLoading(false);
        return;
      }

      console.log('Updating admin password...');
      // TODO: Implement actual API call when endpoint is ready
      // const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/change-password`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword: formData.currentPassword,
      //     newPassword: formData.newPassword
      //   })
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage("Admin password updated successfully!");
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      setErrors({ general: "Failed to update password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle system settings update
  const handleSystemUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setErrors({ general: "Admin authentication required" });
        setIsLoading(false);
        return;
      }

      console.log('Updating system settings...');
      // TODO: Implement actual API call when endpoint is ready
      // const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/system-settings`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     cafeName: formData.cafeName,
      //     timezone: formData.timezone,
      //     currency: formData.currency,
      //     hourlyRate: formData.hourlyRate,
      //     foodTax: formData.foodTax,
      //     autoLogout: formData.autoLogout,
      //     maxLoginAttempts: formData.maxLoginAttempts,
      //     sessionTimeout: formData.sessionTimeout,
      //     backupFrequency: formData.backupFrequency,
      //     maintenanceMode: formData.maintenanceMode,
      //     notifications: formData.notifications
      //   })
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSystemSettings({
        cafeName: formData.cafeName,
        timezone: formData.timezone,
        currency: formData.currency,
        hourlyRate: formData.hourlyRate,
        foodTax: formData.foodTax,
        autoLogout: formData.autoLogout,
        maxLoginAttempts: formData.maxLoginAttempts,
        sessionTimeout: formData.sessionTimeout,
        backupFrequency: formData.backupFrequency,
        maintenanceMode: formData.maintenanceMode,
        notifications: formData.notifications
      });
      
      setSuccessMessage("System settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error('Error updating system settings:', error);
      setErrors({ general: "Failed to update system settings. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backup creation
  const handleCreateBackup = async () => {
    if (window.confirm("Create a full system backup? This may take several minutes.")) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          alert("Admin authentication required");
          setIsLoading(false);
          return;
        }

        console.log('Creating system backup...');
        // TODO: Implement actual API call when endpoint is ready
        // const response = await fetch(`${ADMIN_API_BASE}user-backend.up.railway.app/api/admin/backup`, {
        //   method: 'POST',
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });

        // Simulate backup creation
        await new Promise(resolve => setTimeout(resolve, 3000));
        setSuccessMessage("System backup created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        console.error('Error creating backup:', error);
        setErrors({ general: "Failed to create backup. Please try again." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle system reset
  const handleSystemReset = () => {
    if (window.confirm("DANGER: Reset all system settings to defaults? This action cannot be undone.")) {
      if (window.confirm("Are you absolutely sure? This will reset ALL configuration settings.")) {
        setSuccessMessage("System settings reset to defaults. Please restart the application.");
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    }
  };

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
      padding: "2rem"
    },
    heading: {
      fontSize: "2.25rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      textAlign: "center",
      color: "white"
    },
    subtitle: {
      fontSize: "1rem",
      color: "#9CA3AF",
      textAlign: "center",
      marginBottom: "2rem"
    },

    // Connection status
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

    // Loading state
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      flexDirection: "column"
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },

    // Error state
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

    tabsContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "0.5rem",
      marginBottom: "2rem",
      flexWrap: "wrap"
    },
    tabButton: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.75rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      fontSize: "0.875rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    tabButtonActive: {
      backgroundColor: "#DC2626",
      color: "white"
    },
    tabButtonInactive: {
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },
    panel: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      marginBottom: "2rem",
      border: "1px solid #374151"
    },
    successMessage: {
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      border: "1px solid #10B981",
      color: "#10B981",
      padding: "1rem",
      borderRadius: "0.75rem",
      marginBottom: "1.5rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    errorMessage: {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      border: "1px solid #EF4444",
      color: "#EF4444",
      padding: "1rem",
      borderRadius: "0.75rem",
      marginBottom: "1.5rem"
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "1.5rem",
      marginBottom: "1.5rem"
    },
    formGroup: {
      marginBottom: "1.5rem"
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "600",
      marginBottom: "0.5rem",
      color: "#D1D5DB"
    },
    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#374151",
      color: "white",
      fontSize: "0.875rem",
      transition: "border-color 0.3s, box-shadow 0.3s"
    },
    select: {
      width: "100%",
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#374151",
      color: "white",
      fontSize: "0.875rem",
      cursor: "pointer"
    },
    checkbox: {
      marginRight: "0.5rem",
      transform: "scale(1.2)"
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      fontSize: "0.875rem",
      color: "#D1D5DB",
      cursor: "pointer",
      marginBottom: "0.75rem"
    },
    error: {
      color: "#EF4444",
      fontSize: "0.875rem",
      marginTop: "0.5rem"
    },
    button: {
      backgroundColor: "#DC2626",
      color: "white",
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      fontSize: "0.875rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    buttonHover: {
      backgroundColor: "#B91C1C",
      transform: "translateY(-2px)"
    },
    buttonSecondary: {
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },
    buttonSuccess: {
      backgroundColor: "#16A34A",
      color: "white"
    },
    buttonWarning: {
      backgroundColor: "#D97706",
      color: "white"
    },
    buttonDanger: {
      backgroundColor: "#EF4444",
      color: "white"
    },
    buttonDisabled: {
      backgroundColor: "#6B7280",
      cursor: "not-allowed",
      transform: "none"
    },
    adminCard: {
      backgroundColor: "#374151",
      borderRadius: "1rem",
      padding: "1.5rem",
      marginBottom: "2rem",
      border: "1px solid #4B5563"
    },
    avatar: {
      width: "80px",
      height: "80px",
      backgroundColor: "#DC2626",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "2rem",
      margin: "0 auto 1rem auto",
      border: "3px solid #EF4444"
    },
    avatarText: {
      color: "white",
      fontWeight: "bold"
    },
    adminInfo: {
      textAlign: "center"
    },
    adminName: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      color: "white"
    },
    adminRole: {
      fontSize: "0.875rem",
      color: "#DC2626",
      fontWeight: "600",
      marginBottom: "1rem"
    },
    adminMeta: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
      fontSize: "0.875rem",
      color: "#9CA3AF"
    },
    metaItem: {
      textAlign: "center"
    },
    metaLabel: {
      display: "block",
      marginBottom: "0.25rem",
      fontWeight: "600"
    },
    metaValue: {
      color: "white"
    },
    dangerZone: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: "1rem",
      padding: "2rem",
      border: "1px solid rgba(239, 68, 68, 0.5)"
    },
    dangerHeading: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      color: "#EF4444",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    dangerText: {
      color: "#D1D5DB",
      marginBottom: "1.5rem",
      lineHeight: "1.6"
    },
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap"
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      marginBottom: "1.5rem",
      color: "white",
      borderBottom: "2px solid #374151",
      paddingBottom: "0.5rem"
    },
    notificationGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1rem",
      marginBottom: "1.5rem"
    }
  };

  const tabs = [
    { id: "profile", name: "Admin Profile" },
    { id: "security", name: "Security" },
    { id: "system", name: "System Settings" },
    { id: "notifications", name: "Notifications" },
    { id: "maintenance", name: "Maintenance" }
  ];

  // Loading state
  if (isLoading && activeSection === "profile") {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#9CA3AF" }}>Loading admin settings...</p>
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
            onClick={loadAdminProfile}
            style={{...styles.button, marginTop: "1rem"}}
          >
            Retry Connection
          </button>
          <p style={{ color: "#9CA3AF", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            Trying to connect to: {ADMIN_API_BASE}
          </p>
        </div>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div style={styles.panel}>
      <div style={styles.adminCard}>
        <div style={styles.avatar}>
          <span style={styles.avatarText}>
            {admin.fullName.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
        <div style={styles.adminInfo}>
          <div style={styles.adminName}>{admin.fullName}</div>
          <div style={styles.adminRole}>{admin.role}</div>
          <div style={styles.adminMeta}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Last Login</span>
              <span style={styles.metaValue}>{admin.lastLogin}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Access Level</span>
              <span style={styles.metaValue}>Full Access</span>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleProfileUpdate}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
            {errors.fullName && <p style={styles.error}>{errors.fullName}</p>}
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
            {errors.email && <p style={styles.error}>{errors.email}</p>}
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
          
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(hoveredButton === "profile" ? styles.buttonHover : {}),
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={() => setHoveredButton("profile")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {isLoading ? (
            <>
              <div style={styles.spinner}></div>
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </button>
      </form>
    </div>
  );

  const renderSecurityTab = () => (
    <div style={styles.panel}>
      <h3 style={styles.sectionTitle}>Change Admin Password</h3>
      
      <form onSubmit={handlePasswordUpdate}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            style={styles.input}
            disabled={isLoading}
          />
          {errors.currentPassword && <p style={styles.error}>{errors.currentPassword}</p>}
        </div>
        
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
            {errors.newPassword && <p style={styles.error}>{errors.newPassword}</p>}
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
            {errors.confirmNewPassword && <p style={styles.error}>{errors.confirmNewPassword}</p>}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(hoveredButton === "password" ? styles.buttonHover : {}),
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={() => setHoveredButton("password")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {isLoading ? (
            <>
              <div style={styles.spinner}></div>
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );

  const renderSystemTab = () => (
    <div style={styles.panel}>
      <h3 style={styles.sectionTitle}>System Configuration</h3>
      
      <form onSubmit={handleSystemUpdate}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Cafe Name</label>
            <input
              type="text"
              name="cafeName"
              value={formData.cafeName}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Timezone</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              style={styles.select}
              disabled={isLoading}
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Hourly Rate (IDR)</label>
            <input
              type="number"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Food Tax (%)</label>
            <input
              type="number"
              name="foodTax"
              value={formData.foodTax}
              onChange={handleChange}
              style={styles.input}
              step="0.1"
              disabled={isLoading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Auto Logout (minutes)</label>
            <input
              type="number"
              name="autoLogout"
              value={formData.autoLogout}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Login Attempts</label>
            <input
              type="number"
              name="maxLoginAttempts"
              value={formData.maxLoginAttempts}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={formData.maintenanceMode}
              onChange={handleChange}
              style={styles.checkbox}
              disabled={isLoading}
            />
            Enable Maintenance Mode
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(hoveredButton === "system" ? styles.buttonHover : {}),
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={() => setHoveredButton("system")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {isLoading ? (
            <>
              <div style={styles.spinner}></div>
              Updating...
            </>
          ) : (
            "Update System Settings"
          )}
        </button>
      </form>
    </div>
  );

  const renderNotificationsTab = () => (
    <div style={styles.panel}>
      <h3 style={styles.sectionTitle}>Admin Notifications</h3>
      
      <div style={styles.notificationGrid}>
        {Object.entries(formData.notifications).map(([key, value]) => (
          <label key={key} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => handleNotificationChange(key)}
              style={styles.checkbox}
              disabled={isLoading}
            />
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
      </div>
      
      <button
        onClick={handleSystemUpdate}
        disabled={isLoading}
        style={{
          ...styles.button,
          ...(hoveredButton === "notifications" ? styles.buttonHover : {}),
          ...(isLoading ? styles.buttonDisabled : {})
        }}
        onMouseEnter={() => setHoveredButton("notifications")}
        onMouseLeave={() => setHoveredButton(null)}
      >
        {isLoading ? (
          <>
            <div style={styles.spinner}></div>
            Updating...
          </>
        ) : (
          "Update Notifications"
        )}
      </button>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div style={styles.panel}>
      <h3 style={styles.sectionTitle}>System Maintenance</h3>
      
      <div style={styles.buttonGroup}>
        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...styles.buttonSuccess,
            ...(hoveredButton === "backup" ? styles.buttonHover : {}),
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={() => setHoveredButton("backup")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {isLoading ? (
            <>
              <div style={styles.spinner}></div>
              Creating...
            </>
          ) : (
            "Create System Backup"
          )}
        </button>
        
        <button
          style={{
            ...styles.button,
            ...styles.buttonWarning,
            ...(hoveredButton === "logs" ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setHoveredButton("logs")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Download System Logs
        </button>
        
        <button
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            ...(hoveredButton === "restart" ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setHoveredButton("restart")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Restart Services
        </button>
      </div>
      
      <div style={styles.dangerZone}>
        <h4 style={styles.dangerHeading}>
          Danger Zone
        </h4>
        <p style={styles.dangerText}>
          These actions are irreversible and can significantly impact your system. 
          Please ensure you have recent backups before proceeding.
        </p>
        
        <div style={styles.buttonGroup}>
          <button
            onClick={handleSystemReset}
            style={{
              ...styles.button,
              ...styles.buttonDanger,
              ...(hoveredButton === "reset" ? styles.buttonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("reset")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            Reset System Settings
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.buttonDanger,
              ...(hoveredButton === "factory" ? styles.buttonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("factory")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            Factory Reset
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.innerContainer}>
        <h1 style={styles.heading}>Admin Settings</h1>
        <p style={styles.subtitle}>
          System configuration, admin accounts, and security settings
        </p>
        
        {/* Connection status */}
        <div style={styles.connectionStatus}>
          <p style={styles.connectionText}>
            Connected to Admin Server ({ADMIN_API_BASE})
          </p>
        </div>
        
        {/* Success/Error messages */}
        {successMessage && (
          <div style={styles.successMessage}>
            <p>{successMessage}</p>
            <button
              onClick={() => setSuccessMessage("")}
              style={{ 
                backgroundColor: "transparent", 
                border: "none", 
                color: "#10B981", 
                cursor: "pointer", 
                fontSize: "1.25rem" 
              }}
            >
              ✕
            </button>
          </div>
        )}
        
        {errors.general && (
          <div style={styles.errorMessage}>
            <p>{errors.general}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              style={{
                ...styles.tabButton,
                ...(activeSection === tab.id ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
              onClick={() => setActiveSection(tab.id)}
            >
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        
        {/* Active Section Content */}
        {activeSection === "profile" && renderProfileTab()}
        {activeSection === "security" && renderSecurityTab()}
        {activeSection === "system" && renderSystemTab()}
        {activeSection === "notifications" && renderNotificationsTab()}
        {activeSection === "maintenance" && renderMaintenanceTab()}
      </div>
    </div>
  );
}