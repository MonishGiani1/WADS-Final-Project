import { useState } from "react";

export default function AdminLogin({ onAdminLogin }) {
  const [loginForm, setLoginForm] = useState({ 
    username: "", 
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    const newErrors = {};
    if (!loginForm.username) newErrors.username = "Username is required";
    if (!loginForm.password) newErrors.password = "Password is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🛡️ Attempting admin login with backend...');
      
      const response = await fetch('http://user-backend.up.railway.appuser-backend.up.railway.app/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await response.json();
      console.log('Admin login response:', data);

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        
        console.log('✅ Admin login successful');
        alert(`✅ Welcome ${data.admin.fullName}! Admin login successful.`);
        
        if (onAdminLogin) {
          onAdminLogin(data.admin);
        }
      } else {
        console.error('❌ Admin login failed:', data.error);
        setErrors({ general: data.error });
      }
    } catch (error) {
      console.error('❌ Admin login network error:', error);
      setErrors({ 
        general: 'Failed to connect to admin server. Please check if the server is running on port 5001.' 
      });
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({...loginForm, [name]: value});
    
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
    if (errors.general) {
      setErrors({...errors, general: null});
    }
  };

  const styles = {
    container: {
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0F1419",
      padding: "1rem"
    },
    formContainer: {
      width: "100%",
      maxWidth: "400px",
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem 1.5rem",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
      border: "1px solid #374151",
      maxHeight: "90vh",
      overflowY: "auto"
    },
    formHeader: {
      textAlign: "center",
      marginBottom: "2rem"
    },
    formTitle: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#F9FAFB",
      marginBottom: "0.5rem",
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    formSubtitle: {
      color: "#9CA3AF",
      fontSize: "0.875rem",
      marginBottom: "0.75rem"
    },
    controlPanelText: {
      color: "#DC2626",
      fontSize: "1rem",
      fontWeight: "600"
    },
    errorAlert: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "0.75rem",
      padding: "1rem",
      marginBottom: "1.5rem",
      color: "#EF4444",
      fontSize: "0.875rem",
      textAlign: "center"
    },
    formGroup: {
      marginBottom: "1.25rem",
      position: "relative"
    },
    inputLabel: {
      display: "block",
      color: "#D1D5DB",
      marginBottom: "0.5rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    input: {
      width: "100%",
      padding: "0.875rem 1rem",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      color: "#F9FAFB",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
    },
    passwordToggle: {
      position: "absolute",
      right: "1rem",
      top: "2rem",
      color: "#9CA3AF",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: "500"
    },
    errorMessage: {
      color: "#EF4444",
      fontSize: "0.875rem",
      marginTop: "0.5rem"
    },
    button: {
      width: "100%",
      padding: "0.875rem",
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: "1.5rem",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem"
    },
    buttonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
      transform: "none"
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },
    securityNotice: {
      marginTop: "1.5rem",
      padding: "0.75rem",
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      borderRadius: "0.5rem",
      textAlign: "center"
    },
    securityIcon: {
      color: "#F59E0B",
      fontSize: "1.25rem",
      marginBottom: "0.25rem"
    },
    securityText: {
      color: "#F59E0B",
      fontSize: "0.75rem",
      fontWeight: "500"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <h1 style={styles.formTitle}>ICHI ADMIN</h1>
          <div style={styles.controlPanelText}>Control Panel</div>
          <p style={styles.formSubtitle}>Enter your administrative credentials</p>
        </div>
        
        {errors.general && (
          <div style={styles.errorAlert}>
            🚫 {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.inputLabel}>Admin Username</label>
            <input
              type="text"
              name="username"
              value={loginForm.username}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter admin username"
              disabled={isLoading}
              onFocus={(e) => e.target.style.borderColor = "#EF4444"}
              onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
            />
            {errors.username && <p style={styles.errorMessage}>{errors.username}</p>}
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.inputLabel}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={loginForm.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter admin password"
              disabled={isLoading}
              onFocus={(e) => e.target.style.borderColor = "#EF4444"}
              onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
              disabled={isLoading}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
            {errors.password && <p style={styles.errorMessage}>{errors.password}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {})
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => !isLoading && (e.target.style.transform = "translateY(0)")}
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                Authenticating...
              </>
            ) : (
              "Access Admin Panel"
            )}
          </button>
        </form>

        <div style={styles.securityNotice}>
          <div style={styles.securityIcon}>🔐</div>
          <div style={styles.securityText}>
            This is a secure admin area. All access is logged and monitored.
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}