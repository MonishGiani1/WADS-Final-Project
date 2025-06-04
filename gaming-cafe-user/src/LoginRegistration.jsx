import { useState } from "react";

export default function LoginRegistration({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setErrors({});
    
    const newErrors = {};
    if (!loginForm.email) newErrors.loginEmail = "Email is required";
    if (!loginForm.password) newErrors.loginPassword = "Password is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      });
      
      const data = await response.json();
      
        if (data.success) {
          localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          fullName: data.user.fullName,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          memberSince: data.user.created
        }));
        localStorage.setItem('token', data.token);
        
        alert(`✅ ${data.message} Welcome back, ${data.user.fullName}!`);
        onLogin(data.user);
      } else {
        setErrors({ loginEmail: data.error });
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ loginEmail: 'Network error. Please try again.' });
    }
    
    
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setErrors({});
    
    const newErrors = {};
    if (!registerForm.fullName) newErrors.fullName = "Full name is required";
    if (!registerForm.email) newErrors.email = "Email is required";
    if (!registerForm.password) newErrors.password = "Password is required";
    if (registerForm.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: registerForm.fullName,
          email: registerForm.email,
          password: registerForm.password,
          phoneNumber: registerForm.phoneNumber
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        setActiveTab("login");
        setRegisterForm({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phoneNumber: ""
        });
      } else {
        setErrors({ email: data.error });
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ email: 'Network error. Please try again.' });
    }
    
    
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email address for password reset:");
    if (email) {
      try {
        
        alert('Password reset feature will be available after database integration.');
      } catch (error) {
        alert('Failed to send reset email. Please try again.');
      }
    }
  };

  const handleSocialLogin = (provider) => {
    
    alert(`${provider} login will be available after OAuth integration.`);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({...loginForm, [name]: value});
    
    if (errors.loginEmail || errors.loginPassword) {
      setErrors({...errors, [name === 'email' ? 'loginEmail' : 'loginPassword']: null});
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({...registerForm, [name]: value});
    
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
  };

  const generateStars = (count) => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 3 + 1;
      stars.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        size: `${size}px`
      });
    }
    return stars;
  };

  const stars = generateStars(100);

  const styles = {
    container: {
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0F1419",
      padding: "1rem",
      position: "relative",
      overflow: "hidden"
    },
    starsContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      overflow: "hidden"
    },
    star: {
      position: "absolute",
      backgroundColor: "#ffffff",
      borderRadius: "50%",
      opacity: "0.6",
      animation: "twinkle 5s infinite ease-in-out"
    },
    formContainer: {
      width: "100%",
      maxWidth: "450px",
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "2rem 1.5rem",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
      border: "1px solid #374151",
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
      zIndex: 10
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
      background: "linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    formSubtitle: {
      color: "#9CA3AF",
      fontSize: "0.875rem",
      marginBottom: "0.75rem"
    },
    gamingCafeText: {
      color: "#10B981",
      fontSize: "1rem",
      fontWeight: "600"
    },
    tabs: {
      display: "flex",
      marginBottom: "2rem",
      borderBottom: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem 0.5rem 0 0",
      overflow: "hidden"
    },
    tab: (isActive) => ({
      flex: "1",
      padding: "0.875rem 1rem",
      textAlign: "center",
      fontSize: "0.875rem",
      fontWeight: "700",
      color: isActive ? "#10B981" : "#9CA3AF",
      backgroundColor: isActive ? "rgba(16, 185, 129, 0.1)" : "transparent",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s ease",
      position: "relative",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: isActive ? "3px solid #10B981" : "3px solid transparent"
    }),
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
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1rem"
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center"
    },
    checkbox: {
      marginRight: "0.5rem",
      accentColor: "#10B981"
    },
    checkboxLabel: {
      color: "#D1D5DB",
      fontSize: "0.875rem"
    },
    forgotPassword: {
      color: "#10B981",
      fontSize: "0.875rem",
      textDecoration: "none",
      cursor: "pointer",
      transition: "color 0.3s ease"
    },
    button: {
      width: "100%",
      padding: "0.875rem",
      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
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
      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
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
    socialLogin: {
      marginTop: "2rem"
    },
    socialText: {
      color: "#9CA3AF",
      textAlign: "center",
      position: "relative",
      marginBottom: "1rem",
      fontSize: "0.875rem"
    },
    socialDivider: {
      position: "absolute",
      top: "50%",
      left: "0",
      right: "0",
      height: "1px",
      backgroundColor: "rgba(75, 85, 99, 0.5)",
      zIndex: "0"
    },
    socialTextInner: {
      display: "inline-block",
      padding: "0 1rem",
      backgroundColor: "#1F2937",
      position: "relative",
      zIndex: "1"
    },
    socialButtons: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center"
    },
    socialButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3rem",
      height: "3rem",
      borderRadius: "50%",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      color: "#D1D5DB",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "1.25rem",
      fontWeight: "600"
    },
    promoSection: {
      marginTop: "1.5rem",
      padding: "1rem",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      border: "1px solid rgba(16, 185, 129, 0.3)",
      borderRadius: "0.5rem",
      textAlign: "center"
    },
    promoIcon: {
      color: "#10B981",
      fontSize: "1.5rem",
      marginBottom: "0.5rem"
    },
    promoTitle: {
      color: "#10B981",
      fontSize: "0.875rem",
      fontWeight: "600",
      marginBottom: "0.25rem"
    },
    promoText: {
      color: "#6EE7B7",
      fontSize: "0.75rem"
    },
    demoCredentials: {
      marginTop: "1rem",
      padding: "0.75rem",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      borderRadius: "0.5rem",
      fontSize: "0.6875rem",
      color: "#93C5FD"
    },
    demoTitle: {
      fontWeight: "600",
      marginBottom: "0.25rem",
      color: "#60A5FA"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.starsContainer}>
        {stars.map((star, index) => (
          <div 
            key={index}
            style={{
              ...styles.star,
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.animationDelay
            }} 
          />
        ))}
      </div>

      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <h1 style={styles.formTitle}>ICHI GAMING</h1>
          <div style={styles.gamingCafeText}>Gaming Cafe</div>
          <p style={styles.formSubtitle}>
            {activeTab === "login" ? "Welcome back, gamer!" : "Join our gaming community"}
          </p>
        </div>
        
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("login")}
            style={styles.tab(activeTab === "login")}
            disabled={isLoading}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            style={styles.tab(activeTab === "register")}
            disabled={isLoading}
          >
            Register
          </button>
        </div>
        
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Email Address</label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                style={styles.input}
                placeholder="Enter your email"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
              />
              {errors.loginEmail && <p style={styles.errorMessage}>{errors.loginEmail}</p>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                style={styles.input}
                placeholder="Enter your password"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
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
              {errors.loginPassword && <p style={styles.errorMessage}>{errors.loginPassword}</p>}
            </div>
            
            <div style={styles.checkboxGroup}>
              <div style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="remember"
                  style={styles.checkbox}
                  disabled={isLoading}
                />
                <label htmlFor="remember" style={styles.checkboxLabel}>Remember me</label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={styles.forgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
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
                  Logging in...
                </>
              ) : (
                "Start Gaming"
              )}
            </button>
            
            <div style={styles.socialLogin}>
              <div style={styles.socialText}>
                <div style={styles.socialDivider}></div>
                <span style={styles.socialTextInner}>Or login with</span>
              </div>
              <div style={styles.socialButtons}>
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  style={styles.socialButton}
                  disabled={isLoading}
                  onMouseOver={(e) => e.target.style.backgroundColor = "rgba(16, 185, 129, 0.3)"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "rgba(55, 65, 81, 0.8)"}
                >
                  G
                </button>
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  style={styles.socialButton}
                  disabled={isLoading}
                  onMouseOver={(e) => e.target.style.backgroundColor = "rgba(16, 185, 129, 0.3)"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "rgba(55, 65, 81, 0.8)"}
                >
                  F
                </button>
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('discord')}
                  style={styles.socialButton}
                  disabled={isLoading}
                  onMouseOver={(e) => e.target.style.backgroundColor = "rgba(16, 185, 129, 0.3)"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "rgba(55, 65, 81, 0.8)"}
                >
                  D
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={registerForm.fullName}
                onChange={handleRegisterChange}
                style={styles.input}
                placeholder="Enter your full name"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
              />
              {errors.fullName && <p style={styles.errorMessage}>{errors.fullName}</p>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Email Address</label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                style={styles.input}
                placeholder="Enter your email"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
              />
              {errors.email && <p style={styles.errorMessage}>{errors.email}</p>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={handleRegisterChange}
                style={styles.input}
                placeholder="Enter your phone number"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                style={styles.input}
                placeholder="Create a password"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
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
            
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                style={styles.input}
                placeholder="Confirm your password"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = "#10B981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(75, 85, 99, 0.5)"}
              />
              {errors.confirmPassword && <p style={styles.errorMessage}>{errors.confirmPassword}</p>}
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
                  Creating account...
                </>
              ) : (
                "Join Gaming Community"
              )}
            </button>
          </form>
        )}

        <div style={styles.promoSection}>
          <div style={styles.promoIcon}>🎮</div>
          <div style={styles.promoTitle}>Welcome Bonus</div>
          <div style={styles.promoText}>
            Get 30 minutes free gaming time when you register!
          </div>
        </div>

        <div style={styles.demoCredentials}>
          <div style={styles.demoTitle}>Demo Login:</div>
          <div>Email: demo@ichi.com</div>
          <div>Password: demo123</div>
          <div style={{marginTop: '0.5rem', fontSize: '0.6rem', color: '#93C5FD'}}>
            ⚠️ Remove this section after database is connected
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}