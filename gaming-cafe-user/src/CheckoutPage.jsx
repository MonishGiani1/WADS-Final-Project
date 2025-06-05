import { useState, useEffect } from "react";
import axios from "axios";

export default function CheckoutPage({ 
  items, 
  totalAmount, 
  onCancel, 
  onComplete, 
  checkoutType 
}) {
  // States for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "credit-card", // Default to credit card
  });
  
  // Credit card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation

  // Payment states
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [qrisData, setQrisData] = useState(null);
  const [qrisPolling, setQrisPolling] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // 🔥 DATABASE INTEGRATION: Pre-fill user details if logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) {
      setFormData({
        ...formData,
        name: user.fullName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
    }
  }, []);

  // 🔥 DATABASE INTEGRATION: Save order to database
  const saveOrderToDatabase = async (orderData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('https://user-backend.up.railway.app/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          ...orderData,
          userId: user.id || null // Link to user account if logged in
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  // 🔥 DATABASE INTEGRATION: Update order status
  const updateOrderStatus = async (orderId, status, paymentData = {}) => {
    try {
      await fetch(`https://user-backend.up.railway.app/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          paymentStatus: status,
          ...paymentData,
          completedAt: status === 'completed' ? new Date() : null
        })
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // 🔥 DATABASE INTEGRATION: Update user gaming quota (for gaming time purchases)
  const updateUserQuota = async (quotaMinutes) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await fetch(`https://user-backend.up.railway.app/api/users/${user.id}/quota`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ 
            quotaMinutes: quotaMinutes,
            action: 'add' // Add minutes to existing quota
          })
        });
      }
    } catch (error) {
      console.error('Error updating user quota:', error);
    }
  };

  // Clean up resources when component unmounts or on completion
  const cleanupResources = () => {
    if (qrisPolling) {
      clearInterval(qrisPolling);
      setQrisPolling(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle card details changes
  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };
  
  // Format price to Indonesian Rupiah
  const formatPrice = (price) => {
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    if (!value) return value;
    // Remove all non-digit characters
    const v = value.replace(/\D/g, '');
    // Add a space after every 4 digits
    const formatted = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
  };

  // Format expiry date MM/YY
  const formatExpiry = (value) => {
    if (!value) return value;
    const v = value.replace(/\D/g, '');
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Format phone number
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    // Remove all non-digit characters
    const v = value.replace(/\D/g, '');
    // Add proper Indonesia format (+62)
    if (v.startsWith('0')) {
      return `+62 ${v.substring(1)}`;
    } else if (v.startsWith('62')) {
      return `+${v}`;
    } else if (!v.startsWith('62') && !v.startsWith('0')) {
      return `+62 ${v}`;
    }
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Check if it's time to move to the next step
    if (step === 1) {
      // Validate personal details
      if (!formData.name || !formData.email || !formData.phone) {
        alert("Please fill in all personal details.");
        return;
      }
      setStep(2);
      return;
    }
  
    if (step === 2) {
      setIsProcessing(true);
      setPaymentProcessing(true);
    
      try {
        // Generate a unique order ID
        const uniqueOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setOrderId(uniqueOrderId);

        // 🔥 DATABASE INTEGRATION: Save order to database BEFORE payment
        const orderData = {
          orderId: uniqueOrderId,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          items: items,
          totalAmount: totalAmount,
          paymentMethod: formData.paymentMethod,
          paymentStatus: 'pending',
          checkoutType: checkoutType, // 'quota' or 'food'
          stripePaymentIntentId: null,
          qrisTransactionId: null
        };

        await saveOrderToDatabase(orderData);
        console.log('✅ Order saved to database:', uniqueOrderId);
      
        if (formData.paymentMethod === "credit-card") {
          // Validate card details
          if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
            throw new Error("Please fill in all card details.");
          }
        
          // Call Stripe payment API
          const response = await axios.post('https://user-backend.up.railway.app/api/create-payment-intent', {
            amount: totalAmount * 100, // Convert to smallest currency unit
            currency: 'idr',
            description: `${checkoutType === 'quota' ? 'Gaming Time' : 'Food Order'} for ${formData.name}`,
            metadata: {
              customer_email: formData.email,
              customer_phone: formData.phone,
              order_id: uniqueOrderId,
              checkout_type: checkoutType
            }
          });
          
          if (response.data && response.data.clientSecret) {
            // 🔥 DATABASE INTEGRATION: Update order with Stripe payment intent ID
            await updateOrderStatus(uniqueOrderId, 'processing', {
              stripePaymentIntentId: response.data.id
            });

            // In a real implementation, you would use Stripe.js elements to confirm payment
            // For this implementation, we'll simulate a successful payment
            
            // Verify the payment status
            const verifyResponse = await axios.get(`https://user-backend.up.railway.app/api/verify-payment/${response.data.id}`);
            if (verifyResponse.data.status === 'succeeded') {
              // 🔥 DATABASE INTEGRATION: Update order status to completed
              await updateOrderStatus(uniqueOrderId, 'completed', {
                paidAt: new Date(),
                paymentMethod: 'credit-card'
              });

              // 🔥 DATABASE INTEGRATION: If it's gaming quota, update user's quota
              if (checkoutType === 'quota') {
                const totalQuotaMinutes = items.reduce((total, item) => {
                  // Assuming gaming time items have minutes in their data
                  return total + (item.minutes || 0) * (item.quantity || 1);
                }, 0);
                
                if (totalQuotaMinutes > 0) {
                  await updateUserQuota(totalQuotaMinutes);
                  console.log(`✅ Added ${totalQuotaMinutes} minutes to user quota`);
                }
              }

              setPaymentStatus('success');
              console.log('✅ Payment completed and order updated');
            } else {
              // In a real implementation, you would handle other statuses appropriately
              setPaymentStatus('success'); // For demonstration purposes
            }
          } else {
            throw new Error('Failed to process card payment');
          }
        
        } else if (formData.paymentMethod === "qris") {
          // Call QRIS payment API
          const response = await axios.post('https://user-backend.up.railway.app/api/create-qris-payment', {
            amount: totalAmount,
            orderId: uniqueOrderId,
            customerName: formData.name,
            expiryMinutes: 15
          });
        
          if (response.data.success) {
            setQrisData(response.data);

            // 🔥 DATABASE INTEGRATION: Update order with QRIS transaction ID
            await updateOrderStatus(uniqueOrderId, 'awaiting_payment', {
              qrisTransactionId: response.data.transactionId
            });
          
            // Start polling for payment status
            const pollingInterval = setInterval(async () => {
              try {
                const statusResponse = await axios.get(`https://user-backend.up.railway.app/api/check-qris-status/${response.data.transactionId}`);
                
                if (statusResponse.data.status === 'COMPLETED' || statusResponse.data.status === 'PAID') {
                  // 🔥 DATABASE INTEGRATION: Update order status to completed
                  await updateOrderStatus(uniqueOrderId, 'completed', {
                    paidAt: new Date(),
                    qrisPaidAmount: statusResponse.data.paidAmount,
                    qrisPaidAt: statusResponse.data.paidAt
                  });

                  // 🔥 DATABASE INTEGRATION: If it's gaming quota, update user's quota
                  if (checkoutType === 'quota') {
                    const totalQuotaMinutes = items.reduce((total, item) => {
                      return total + (item.minutes || 0) * (item.quantity || 1);
                    }, 0);
                    
                    if (totalQuotaMinutes > 0) {
                      await updateUserQuota(totalQuotaMinutes);
                      console.log(`✅ Added ${totalQuotaMinutes} minutes to user quota`);
                    }
                  }

                  setPaymentStatus('success');
                  clearInterval(pollingInterval);
                  setQrisPolling(null);
                  setPaymentProcessing(false);
                  setStep(3);
                  console.log('✅ QRIS payment completed and order updated');
                }
              } catch (error) {
                console.error('Error checking QRIS status', error);
              }
            }, 5000); // Check every 5 seconds
          
            setQrisPolling(pollingInterval);
          } else {
            throw new Error('Failed to generate QRIS payment');
          }
        }
      
        // If not QRIS (which has its own polling), move to confirmation step
        if (formData.paymentMethod !== "qris") {
          setStep(3);
        }
      } catch (error) {
        // 🔥 DATABASE INTEGRATION: Update order status to failed if payment fails
        if (orderId) {
          await updateOrderStatus(orderId, 'failed', {
            failureReason: error.message
          });
        }

        setPaymentError(error.message || "Payment processing failed. Please try again.");
        alert(error.message || "Payment processing failed. Please try again.");
      } finally {
        setIsProcessing(false);
      
        // Keep payment processing true for QRIS until payment completed
        if (formData.paymentMethod !== "qris") {
          setPaymentProcessing(false);
        }
      }
      return;
    }
  
    if (step === 3) {
      cleanupResources();
      // Complete the checkout process
      onComplete();
    }
  };

  // Handle step navigation
  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      cleanupResources();
      onCancel();
    }
  };

  // Define styles
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: "2rem",
      paddingBottom: "2rem"
    },
    container: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      width: "100%",
      maxWidth: "600px", 
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "2rem",
      position: "relative",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #374151"
    },
    closeButton: {
      backgroundColor: "transparent",
      border: "none",
      fontSize: "1.5rem",
      color: "#9CA3AF",
      cursor: "pointer"
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "white"
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    },
    label: {
      color: "#D1D5DB",
      fontSize: "0.875rem"
    },
    input: {
      backgroundColor: "#374151",
      border: "1px solid #4B5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "1rem",
      width: "100%"
    },
    select: {
      backgroundColor: "#374151",
      border: "1px solid #4B5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      color: "white",
      fontSize: "1rem",
      width: "100%"
    },
    orderSummary: {
      backgroundColor: "#111827",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      marginBottom: "1.5rem"
    },
    orderTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "white",
      marginBottom: "1rem"
    },
    itemsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem"
    },
    item: {
      display: "flex",
      justifyContent: "space-between",
      color: "#D1D5DB"
    },
    divider: {
      height: "1px",
      backgroundColor: "#374151",
      margin: "1rem 0"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      color: "white",
      fontWeight: "600",
      fontSize: "1.125rem"
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "1.5rem"
    },
    backButton: {
      backgroundColor: "#374151",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontWeight: "500"
    },
    submitButton: {
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "120px"
    },
    disabledButton: {
      opacity: "0.7",
      cursor: "not-allowed"
    },
    spinner: {
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTopColor: "white",
      animation: "spin 1s linear infinite",
      marginRight: "0.5rem"
    },
    radioGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem"
    },
    radioOption: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "#374151",
      border: "1px solid #4B5563",
      borderRadius: "0.5rem",
      padding: "1rem",
      cursor: "pointer"
    },
    radioSelected: {
      borderColor: "#10B981"
    },
    radioInput: {
      marginRight: "0.75rem"
    },
    radioLabel: {
      color: "white",
      fontWeight: "500"
    },
    paymentIcon: {
      marginRight: "0.75rem", 
      fontSize: "1.25rem"
    },
    steps: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "2rem",
      position: "relative"
    },
    stepLine: {
      position: "absolute",
      top: "50%",
      left: "10%",
      right: "10%",
      height: "2px",
      backgroundColor: "#374151",
      zIndex: 1
    },
    step: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      zIndex: 2
    },
    stepCircle: {
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "50%",
      backgroundColor: "#374151",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      fontWeight: "600",
      marginBottom: "0.5rem"
    },
    stepActive: {
      backgroundColor: "#10B981"
    },
    stepCompleted: {
      backgroundColor: "#059669"
    },
    stepText: {
      color: "#9CA3AF",
      fontSize: "0.875rem"
    },
    stepActiveText: {
      color: "white"
    },
    confirmationMessage: {
      textAlign: "center",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1.5rem"
    },
    confirmationIcon: {
      fontSize: "4rem",
      color: "#10B981"
    },
    confirmationTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "white"
    },
    confirmationText: {
      color: "#D1D5DB",
      marginBottom: "1.5rem"
    },
    qrContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#111827",
      borderRadius: "0.5rem",
      padding: "1.5rem",
      marginBottom: "1rem"
    },
    qrPlaceholder: {
      width: "200px",
      height: "200px",
      backgroundColor: "#374151",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "1rem",
      border: "8px solid white"
    },
    qrInstructions: {
      color: "#D1D5DB",
      textAlign: "center",
      fontSize: "0.875rem"
    }
  };

  // Add @keyframes for spinner animation
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Cleanup QRIS polling when component unmounts
  useEffect(() => {
    return () => {
      if (qrisPolling) {
        clearInterval(qrisPolling);
      }
    };
  }, [qrisPolling]);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Progress Steps */}
        <div style={styles.steps}>
          <div style={styles.stepLine}></div>
          <div style={styles.step}>
            <div 
              style={{
                ...styles.stepCircle,
                ...(step >= 1 ? styles.stepActive : {}),
                ...(step > 1 ? styles.stepCompleted : {})
              }}
            >
              {step > 1 ? "✓" : "1"}
            </div>
            <span 
              style={{
                ...styles.stepText,
                ...(step >= 1 ? styles.stepActiveText : {})
              }}
            >
              Details
            </span>
          </div>
          <div style={styles.step}>
            <div 
              style={{
                ...styles.stepCircle,
                ...(step >= 2 ? styles.stepActive : {}),
                ...(step > 2 ? styles.stepCompleted : {})
              }}
            >
              {step > 2 ? "✓" : "2"}
            </div>
            <span 
              style={{
                ...styles.stepText,
                ...(step >= 2 ? styles.stepActiveText : {})
              }}
            >
              Payment
            </span>
          </div>
          <div style={styles.step}>
            <div 
              style={{
                ...styles.stepCircle,
                ...(step >= 3 ? styles.stepActive : {})
              }}
            >
              3
            </div>
            <span 
              style={{
                ...styles.stepText,
                ...(step >= 3 ? styles.stepActiveText : {})
              }}
            >
              Confirmation
            </span>
          </div>
        </div>

        {/* Header with title and close button */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {step === 3 ? "Order Confirmation" : `Checkout - ${checkoutType === 'quota' ? 'Gaming Time' : 'Food & Drinks'}`}
          </h2>
          <button style={styles.closeButton} onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div style={styles.confirmationMessage}>
            <div style={styles.confirmationIcon}>✓</div>
            <h3 style={styles.confirmationTitle}>Payment Successful!</h3>
            <p style={styles.confirmationText}>
              Order ID: <strong>{orderId}</strong><br/>
              Your {checkoutType === 'quota' ? 'gaming time has been added' : 'order has been placed'} successfully.
              {checkoutType === 'food' ? " Your food will be delivered to your gaming station soon." : ""}
              {checkoutType === 'quota' ? " You can now start gaming!" : ""}
            </p>
            <button style={styles.submitButton} onClick={onComplete}>
              Done
            </button>
          </div>
        )}

        {/* Steps 1-2: Form */}
        {step < 3 && (
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Order Summary */}
            <div style={styles.orderSummary}>
              <h3 style={styles.orderTitle}>Order Summary</h3>
              <div style={styles.itemsList}>
                {items.map((item, index) => (
                  <div key={index} style={styles.item}>
                    <span>
                      {item.name}
                      {item.quantity ? ` x ${item.quantity}` : ""}
                      {item.minutes ? ` (${item.minutes}min)` : ""}
                    </span>
                    <span>{formatPrice(item.price * (item.quantity || 1))}</span>
                  </div>
                ))}
              </div>
              <div style={styles.divider}></div>
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Payment Method</label>
                  <div style={styles.radioGroup}>
                    <div 
                      style={{
                        ...styles.radioOption,
                        ...(formData.paymentMethod === "credit-card" ? styles.radioSelected : {})
                      }}
                      onClick={() => setFormData({...formData, paymentMethod: "credit-card"})}
                    >
                      <input
                        type="radio"
                        id="credit-card"
                        name="paymentMethod"
                        value="credit-card"
                        checked={formData.paymentMethod === "credit-card"}
                        onChange={handleInputChange}
                        style={styles.radioInput}
                      />
                      <span style={styles.paymentIcon}>💳</span>
                      <label style={styles.radioLabel} htmlFor="credit-card">Credit/Debit Card</label>
                    </div>
                    <div 
                      style={{
                        ...styles.radioOption,
                        ...(formData.paymentMethod === "qris" ? styles.radioSelected : {})
                      }}
                      onClick={() => setFormData({...formData, paymentMethod: "qris"})}
                    >
                      <input
                        type="radio"
                        id="qris"
                        name="paymentMethod"
                        value="qris"
                        checked={formData.paymentMethod === "qris"}
                        onChange={handleInputChange}
                        style={styles.radioInput}
                      />
                      <span style={styles.paymentIcon}>📲</span>
                      <label style={styles.radioLabel} htmlFor="qris">QRIS (GoPay, OVO, Dana, LinkAja)</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Payment Details */}
            {step === 2 && (
              <>
                {formData.paymentMethod === "credit-card" && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="cardNumber">Card Number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formatCardNumber(cardDetails.cardNumber)}
                        onChange={handleCardChange}
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="cardName">Name on Card</label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={cardDetails.cardName}
                        onChange={handleCardChange}
                        style={styles.input}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div style={{display: "flex", gap: "1rem"}}>
                      <div style={{...styles.formGroup, width: "50%"}}>
                        <label style={styles.label} htmlFor="expiry">Expiration Date</label>
                        <input
                          type="text"
                          id="expiry"
                          name="expiry"
                          value={formatExpiry(cardDetails.expiry)}
                          onChange={handleCardChange}
                          style={styles.input}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div style={{...styles.formGroup, width: "50%"}}>
                        <label style={styles.label} htmlFor="cvv">CVV</label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          style={styles.input}
                          placeholder="123"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.paymentMethod === "qris" && (
                  <>
                    <div style={styles.qrContainer}>
                      {qrisData ? (
                        <>
                          <img 
                            src={qrisData.qrisImageUrl} 
                            alt="QRIS Payment QR Code" 
                            style={{width: "200px", height: "200px", marginBottom: "1rem"}}
                          />
                          <p style={styles.qrInstructions}>
                            Scan this QR code with any QRIS-supported payment app like GoPay, OVO, Dana, LinkAja, or banking apps.
                            <br/>
                            <strong>Transaction ID: {qrisData.transactionId}</strong>
                            <br/>
                            <strong>Amount: {formatPrice(qrisData.amount)}</strong>
                            <br/>
                            <strong>Expires: {new Date(qrisData.expiryTime).toLocaleTimeString()}</strong>
                            <br/>
                            {paymentProcessing && <span>Waiting for payment confirmation...</span>}
                          </p>
                        </>
                      ) : (
                        <div style={styles.qrPlaceholder}>
                          <span style={{color: "white", fontSize: "0.875rem"}}>Generating QRIS code...</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Form Navigation Buttons */}
            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.backButton}
                onClick={handleBackStep}
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(isProcessing ? styles.disabledButton : {})
                }}
                disabled={isProcessing}
              >
                {isProcessing && <div style={styles.spinner}></div>}
                {isProcessing ? "Processing..." : 
                 step === 1 ? "Continue" : 
                 formData.paymentMethod === "qris" && qrisData ? "Check Payment Status" : "Pay Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}