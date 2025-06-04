import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    memberSince: null
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [hoveredButton, setHoveredButton] = useState(null);

  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        console.log('Loading user data:', { storedUser, token });
        
        if (storedUser.id && token) {
          const response = await fetch(`/api/users/${storedUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('API Response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User data from API:', userData);
            
            setUser({
              fullName: userData.user.fullName || '',
              email: userData.user.email || '',
              phoneNumber: userData.user.phoneNumber || '',
              memberSince: userData.user.created
            });
            
            setFormData({
              fullName: userData.user.fullName || '',
              email: userData.user.email || '',
              phoneNumber: userData.user.phoneNumber || '',
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
          } else {
            console.log('API failed, using localStorage');
            setUser(storedUser);
            setFormData({
              fullName: storedUser.fullName || '',
              email: storedUser.email || '',
              phoneNumber: storedUser.phoneNumber || '',
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
          }
        } else {
          console.log('No user ID or token found');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        setFormData({
          fullName: storedUser.fullName || '',
          email: storedUser.email || '',
          phoneNumber: storedUser.phoneNumber || '',
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      }
    };

    loadUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    console.log('Starting profile update with data:', formData);
    
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
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Making API call to update profile:', {
        userId: storedUser.id,
        token: token ? 'exists' : 'missing',
        url: `/api/users/${storedUser.id}`,
        payload: {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber
        }
      });
      
      if (!storedUser.id) {
        console.error('No user ID found in localStorage');
        setErrors({ general: 'User ID not found. Please log in again.' });
        setIsLoading(false);
        return;
      }
      
      if (!token) {
        console.error('No token found in localStorage');
        setErrors({ general: 'Authentication token not found. Please log in again.' });
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/users/${storedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber
        })
      });
      
      console.log('Profile update response status:', response.status);
      console.log('Profile update response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('Content-Type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.log('Non-JSON response:', textData);
        data = { error: 'Server returned non-JSON response', details: textData };
      }
      
      console.log('Profile update response data:', data);
      
      if (response.ok) {
        if (data.success || data.message === 'success' || response.status === 200) {
          const updatedUser = {
            ...user,
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
          };
          setUser(updatedUser);
          
          const userToStore = {
            ...storedUser,
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
          };
          localStorage.setItem('user', JSON.stringify(userToStore));
          
          setSuccessMessage("Profile updated successfully!");
          
          setTimeout(() => {
            setSuccessMessage("");
          }, 3000);
        } else {
          console.error('Profile update failed (response ok but no success indicator):', data);
          setErrors({ general: data.error || data.message || 'Update may have failed - check your backend response format' });
        }
      } else {
        console.error('Profile update failed (response not ok):', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        let errorMessage = 'Failed to update profile';
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 404) {
          errorMessage = 'User not found. Please log in again.';
        } else if (response.status === 400) {
          errorMessage = data.error || data.message || 'Invalid data provided.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (data.error || data.message) {
          errorMessage = data.error || data.message;
        }
        
        setErrors({ general: errorMessage });
      }
      
    } catch (error) {
      console.error('Profile update error (network/other):', error);
      setErrors({ general: `Network error: ${error.message}` });
    }
    
    setIsLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    console.log('Starting password update');
    
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
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
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Making API call to update password for user:', storedUser.id);
      
      const response = await fetch(`/api/users/${storedUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      
      console.log('Password update response status:', response.status);
      
      const data = await response.json();
      console.log('Password update response data:', data);
      
      if (response.ok && data.success) {
        setSuccessMessage("Password updated successfully!");
        
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        console.error('Password update failed:', data);
        setErrors({ currentPassword: data.error || data.message || 'Failed to update password' });
      }
      
    } catch (error) {
      console.error('Password update error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    }
    
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('Attempting to delete account for user:', storedUser.id);
        
        const response = await fetch(`/api/users/${storedUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('Delete account response:', data);
        
        if (data.success) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setSuccessMessage("Account deleted successfully. Redirecting...");
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setErrors({ general: data.error || 'Failed to delete account' });
        }
        
      } catch (error) {
        console.error('Account deletion error:', error);
        setErrors({ general: 'Network error. Please try again.' });
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
      padding: "1.5rem"
    },
    heading: {
      fontSize: "2.25rem",
      fontWeight: "700",
      marginBottom: "1.5rem",
      textAlign: "center",
      color: "white"
    },
    tabsContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      marginBottom: "2rem"
    },
    tabButton: {
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s, transform 0.2s",
      backgroundColor: "#374151",
      color: "#D1D5DB"
    },
    tabButtonActive: {
      backgroundColor: "#10B981",
      color: "white"
    },
    panel: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem",
      marginBottom: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    successMessage: {
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      border: "1px solid #10B981",
      color: "#10B981",
      padding: "1rem",
      borderRadius: "0.5rem",
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
      borderRadius: "0.5rem",
      marginBottom: "1.5rem"
    },
    formGroup: {
      marginBottom: "1.5rem"
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
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
      transition: "border-color 0.3s, box-shadow 0.3s"
    },
    inputFocus: {
      borderColor: "#10B981",
      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.3)"
    },
    error: {
      color: "#EF4444",
      fontSize: "0.875rem",
      marginTop: "0.5rem"
    },
    button: {
      backgroundColor: "#10B981",
      color: "white",
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s, transform 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem"
    },
    buttonHover: {
      backgroundColor: "#059669",
      transform: "translateY(-2px)"
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
    dangerZone: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: "1rem",
      padding: "2rem",
      marginBottom: "2rem",
      border: "1px solid rgba(239, 68, 68, 0.5)"
    },
    dangerHeading: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      color: "#EF4444"
    },
    dangerText: {
      color: "#D1D5DB",
      marginBottom: "1.5rem"
    },
    dangerButton: {
      backgroundColor: "#EF4444",
      color: "white",
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s, transform 0.2s"
    },
    dangerButtonHover: {
      backgroundColor: "#DC2626",
      transform: "translateY(-2px)"
    },
    avatar: {
      width: "120px",
      height: "120px",
      backgroundColor: "#374151",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "3rem",
      margin: "0 auto 2rem auto",
      border: "4px solid #10B981"
    },
    avatarText: {
      color: "white",
      fontWeight: "bold"
    },
    memberInfo: {
      textAlign: "center",
      marginBottom: "2rem",
      padding: "1rem",
      backgroundColor: "#374151",
      borderRadius: "0.5rem"
    },
    memberSince: {
      fontSize: "1rem",
      color: "#10B981",
      fontWeight: "600"
    },
    memberDate: {
      fontSize: "0.875rem",
      color: "#D1D5DB",
      marginTop: "0.25rem"
    }
  };

  const renderProfileTab = () => (
    <div style={styles.panel}>
      <div style={styles.avatar}>
        <span style={styles.avatarText}>
          {user.fullName ? user.fullName.split(" ").map(n => n[0]).join("") : "U"}
        </span>
      </div>

      <div style={styles.memberInfo}>
        <div style={styles.memberSince}>Member Since</div>
        <div style={styles.memberDate}>
          {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'N/A'}
        </div>
      </div>
      
      <form onSubmit={handleProfileUpdate}>
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
          {errors.phoneNumber && <p style={styles.error}>{errors.phoneNumber}</p>}
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
          {isLoading && <div style={styles.spinner}></div>}
          {isLoading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );

  const renderSecurityTab = () => (
    <div style={styles.panel}>
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
          {isLoading && <div style={styles.spinner}></div>}
          {isLoading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );

  const renderDangerZone = () => (
    <div style={styles.dangerZone}>
      <h3 style={styles.dangerHeading}>Danger Zone</h3>
      <p style={styles.dangerText}>
        Deleting your account is permanent. All your data, gaming time, and order history will be permanently removed and cannot be recovered.
      </p>
      <button
        onClick={handleDeleteAccount}
        disabled={isLoading}
        style={{
          ...styles.dangerButton,
          ...(hoveredButton === "delete" ? styles.dangerButtonHover : {}),
          ...(isLoading ? styles.buttonDisabled : {})
        }}
        onMouseEnter={() => setHoveredButton("delete")}
        onMouseLeave={() => setHoveredButton(null)}
      >
        {isLoading ? "Deleting..." : "Delete Account"}
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <h1 style={styles.heading}>Account Settings</h1>
        
        {successMessage && (
          <div style={styles.successMessage}>
            <p>{successMessage}</p>
            <button
              onClick={() => setSuccessMessage("")}
              style={{ backgroundColor: "transparent", border: "none", color: "#10B981", cursor: "pointer", fontSize: "1.25rem" }}
            >
              &times;
            </button>
          </div>
        )}

        {errors.general && (
          <div style={styles.errorMessage}>
            <p>{errors.general}</p>
          </div>
        )}
        
        <div style={styles.tabsContainer}>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeSection === "profile" ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveSection("profile")}
          >
            Profile
          </button>
          <button 
            style={{
              ...styles.tabButton,
              ...(activeSection === "security" ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveSection("security")}
          >
            Security
          </button>
        </div>
        
        {activeSection === "profile" && renderProfileTab()}
        {activeSection === "security" && renderSecurityTab()}
        
        {renderDangerZone()}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}