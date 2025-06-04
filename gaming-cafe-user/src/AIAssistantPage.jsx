import { useState } from "react";

export default function AIAssistantPage({ userInfo }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      text: "👋 Hi! I'm your ICHI Gaming Cafe AI Assistant powered by Google Gemini. I can help you with game recommendations, cafe information, or answer any questions!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getGeminiResponse = async (userMessage) => {
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          userContext: {
            name: userInfo.name,
            remainingTime: userInfo.remainingTime,
            balance: userInfo.balance,
            station: userInfo.station
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.error || 'AI service unavailable');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      return "🚫 I'm having trouble connecting to my brain right now. Please try again in a moment!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const aiResponse = await getGeminiResponse(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: "🚫 Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const quickActions = [
    { text: "Recommend me a game", icon: "🎮" },
    { text: "What food should I order?", icon: "🍔" },
    { text: "How much time do I have left?", icon: "⏰" },
    { text: "Help with technical issues", icon: "🔧" }
  ];

  const styles = {
    container: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#111827",
      color: "white",
      padding: "1.5rem"
    },
    header: {
      marginBottom: "2rem",
      textAlign: "center"
    },
    title: {
      fontSize: "2rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC04 75%, #EA4335 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "0.5rem"
    },
    subtitle: {
      color: "#9CA3AF",
      fontSize: "0.875rem"
    },
    aiStatus: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "rgba(34, 197, 94, 0.2)",
      borderRadius: "2rem",
      fontSize: "0.875rem",
      color: "#34D399",
      marginTop: "1rem"
    },
    statusDot: {
      width: "0.5rem",
      height: "0.5rem",
      backgroundColor: "#10B981",
      borderRadius: "50%",
      animation: "pulse 2s infinite"
    },
    chatContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(55, 65, 81, 0.3)",
      borderRadius: "1rem",
      padding: "1.5rem",
      border: "1px solid rgba(75, 85, 99, 0.3)"
    },
    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      marginBottom: "1rem",
      maxHeight: "400px",
      paddingRight: "0.5rem"
    },
    message: {
      marginBottom: "1rem",
      display: "flex",
      gap: "0.75rem",
      alignItems: "flex-start"
    },
    messageAvatar: {
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2rem",
      flexShrink: 0
    },
    userAvatar: {
      backgroundColor: "#3B82F6"
    },
    aiAvatar: {
      background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)"
    },
    messageContent: {
      flex: 1
    },
    messageText: {
      padding: "1rem 1.25rem",
      borderRadius: "1.25rem",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      wordWrap: "break-word"
    },
    userMessage: {
      backgroundColor: "#3B82F6",
      color: "white",
      marginLeft: "auto",
      maxWidth: "85%",
      borderBottomRightRadius: "0.5rem"
    },
    aiMessage: {
      backgroundColor: "rgba(17, 24, 39, 0.8)",
      color: "white",
      maxWidth: "85%",
      border: "1px solid rgba(75, 85, 99, 0.3)",
      borderBottomLeftRadius: "0.5rem"
    },
    messageTime: {
      fontSize: "0.75rem",
      color: "#9CA3AF",
      marginTop: "0.5rem",
      textAlign: "right"
    },
    quickActionsContainer: {
      marginBottom: "1.5rem"
    },
    quickActionsTitle: {
      fontSize: "0.875rem",
      fontWeight: "600",
      marginBottom: "0.75rem",
      color: "#D1D5DB"
    },
    quickActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem"
    },
    quickAction: {
      padding: "0.75rem 1rem",
      backgroundColor: "rgba(66, 133, 244, 0.2)",
      border: "1px solid rgba(66, 133, 244, 0.3)",
      borderRadius: "2rem",
      fontSize: "0.8rem",
      color: "#93C5FD",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    inputContainer: {
      display: "flex",
      gap: "0.75rem",
      padding: "1rem",
      backgroundColor: "rgba(17, 24, 39, 0.6)",
      borderRadius: "1rem",
      border: "1px solid rgba(75, 85, 99, 0.5)"
    },
    input: {
      flex: 1,
      padding: "0.875rem 1rem",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.75rem",
      color: "white",
      fontSize: "0.875rem",
      outline: "none"
    },
    sendButton: {
      padding: "0.875rem 1.5rem",
      background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
      color: "white",
      border: "none",
      borderRadius: "0.75rem",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "1rem 1.25rem"
    },
    loadingDots: {
      display: "flex",
      gap: "0.25rem"
    },
    dot: {
      width: "0.5rem",
      height: "0.5rem",
      backgroundColor: "#4285F4",
      borderRadius: "50%",
      animation: "bounce 1.4s infinite ease-in-out"
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .bounce-1 { animation-delay: -0.32s; }
        .bounce-2 { animation-delay: -0.16s; }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>🤖 AI Assistant</h1>
        <p style={styles.subtitle}>Powered by Google Gemini AI</p>
        <div style={styles.aiStatus}>
          <div style={styles.statusDot}></div>
          Gemini AI Online
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map(message => (
            <div key={message.id} style={styles.message}>
              {message.type === 'ai' && (
                <div style={{...styles.messageAvatar, ...styles.aiAvatar}}>
                  🤖
                </div>
              )}
              <div style={styles.messageContent}>
                <div style={{
                  ...styles.messageText,
                  ...(message.type === 'user' ? styles.userMessage : styles.aiMessage)
                }}>
                  {message.text}
                </div>
                <div style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              {message.type === 'user' && (
                <div style={{...styles.messageAvatar, ...styles.userAvatar}}>
                  {userInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={styles.message}>
              <div style={{...styles.messageAvatar, ...styles.aiAvatar}}>🤖</div>
              <div style={styles.messageContent}>
                <div style={{...styles.messageText, ...styles.aiMessage}}>
                  <div style={styles.loadingContainer}>
                    <span>Gemini is thinking</span>
                    <div style={styles.loadingDots}>
                      <div style={styles.dot} className="bounce-1"></div>
                      <div style={styles.dot} className="bounce-2"></div>
                      <div style={styles.dot}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.quickActionsContainer}>
          <div style={styles.quickActionsTitle}>Quick Actions:</div>
          <div style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                style={styles.quickAction}
                onClick={() => setInputMessage(action.text)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "rgba(66, 133, 244, 0.4)";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "rgba(66, 133, 244, 0.2)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <span>{action.icon}</span>
                {action.text}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Gemini anything about games, food, or cafe services..."
            style={styles.input}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            style={{
              ...styles.sendButton,
              opacity: isLoading || !inputMessage.trim() ? 0.6 : 1,
              cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && inputMessage.trim()) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {isLoading ? "Sending..." : "Send"} 🚀
          </button>
        </div>
      </div>
    </div>
  );
}