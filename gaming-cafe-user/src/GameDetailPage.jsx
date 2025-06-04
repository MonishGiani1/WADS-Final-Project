import { useState, useEffect } from "react";

export default function GameDetailPage({ game, onBack, onLaunch, isLaunching }) {
  const [localLaunching, setLocalLaunching] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [currentScreenshot, setCurrentScreenshot] = useState(0);

  const launching = isLaunching || localLaunching;

  const gameDetails = {
    ...game,
    rating: "4.8",
    reviews: "125,430",
    size: "45.2 GB",
    lastUpdated: "2 days ago",
    publisher: getPublisher(game.name),
    developer: getDeveloper(game.name),
    releaseDate: getReleaseDate(game.name),
    systemRequirements: getSystemRequirements(game.category),
    features: getFeatures(game.category),
    screenshots: getScreenshots(game.name)
  };

  function getPublisher(gameName) {
    const publishers = {
      "Valorant": "Riot Games",
      "Counter Strike 2": "Valve Corporation",
      "Apex Legends": "Electronic Arts",
      "Fortnite": "Epic Games",
      "Minecraft": "Mojang Studios",
      "Marvel Rivals": "NetEase Games",
      "Overwatch": "Blizzard Entertainment",
      "Rainbow Six Siege": "Ubisoft",
      "League of Legends": "Riot Games",
      "Call of Duty": "Activision",
      "FIFA": "EA Sports",
      "PUBG": "KRAFTON",
      "Rocket League": "Psyonix",
      "Destiny 2": "Bungie",
      "Battlefield": "Electronic Arts"
    };
    return publishers[gameName] || "Unknown Publisher";
  }

  function getDeveloper(gameName) {
    const developers = {
      "Valorant": "Riot Games",
      "Counter Strike 2": "Valve Corporation",
      "Apex Legends": "Respawn Entertainment",
      "Fortnite": "Epic Games",
      "Minecraft": "Mojang Studios",
      "Marvel Rivals": "NetEase Games",
      "Overwatch": "Blizzard Entertainment",
      "Rainbow Six Siege": "Ubisoft Montreal",
      "League of Legends": "Riot Games",
      "Call of Duty": "Infinity Ward",
      "FIFA": "EA Vancouver",
      "PUBG": "PUBG Corporation",
      "Rocket League": "Psyonix",
      "Destiny 2": "Bungie",
      "Battlefield": "DICE"
    };
    return developers[gameName] || "Unknown Developer";
  }

  function getReleaseDate(gameName) {
    const releaseDates = {
      "Valorant": "June 2, 2020",
      "Counter Strike 2": "September 27, 2023",
      "Apex Legends": "February 4, 2019",
      "Fortnite": "July 21, 2017",
      "Minecraft": "November 18, 2011",
      "Marvel Rivals": "December 6, 2024",
      "Overwatch": "May 24, 2016",
      "Rainbow Six Siege": "December 1, 2015",
      "League of Legends": "October 27, 2009",
      "Call of Duty": "October 29, 2003",
      "FIFA": "September 29, 2023",
      "PUBG": "December 20, 2017",
      "Rocket League": "July 7, 2015",
      "Destiny 2": "September 6, 2017",
      "Battlefield": "October 19, 2018"
    };
    return releaseDates[gameName] || "Unknown";
  }

  function getSystemRequirements(category) {
    const requirements = {
      fps: {
        minimum: "Intel i3-4150 / AMD FX-6300, 4GB RAM, GTX 1050 / RX 560",
        recommended: "Intel i5-8400 / AMD Ryzen 5 2600, 8GB RAM, GTX 1660 / RX 580"
      },
      "battle-royale": {
        minimum: "Intel i5-6600K / AMD Ryzen 5 1600, 8GB RAM, GTX 1060 / RX 580",
        recommended: "Intel i7-8700K / AMD Ryzen 7 2700X, 16GB RAM, GTX 1070 / RX 6600 XT"
      },
      moba: {
        minimum: "Intel i3-3250 / AMD FX-4350, 2GB RAM, Intel HD 4000",
        recommended: "Intel i5-3300 / AMD FX-6300, 4GB RAM, GTX 560 / HD 6870"
      },
      sports: {
        minimum: "Intel i3-6100 / AMD Athlon X4 880K, 8GB RAM, GTX 660 / HD 7850",
        recommended: "Intel i5-3550 / AMD FX 8150, 8GB RAM, GTX 670 / HD 7870"
      },
      sandbox: {
        minimum: "Intel i3-3210 / AMD A8-7600, 4GB RAM, Intel HD 4000",
        recommended: "Intel i5-4690 / AMD A10-7800, 8GB RAM, GTX 700 Series"
      }
    };
    return requirements[category] || requirements.fps;
  }

  function getFeatures(category) {
    const features = {
      fps: ["Competitive Multiplayer", "Voice Chat", "Anti-Cheat Protection", "Ranked System"],
      "battle-royale": ["100 Player Matches", "Cross-Platform Play", "Seasonal Content", "Squad Play"],
      moba: ["5v5 Matches", "Champion Selection", "Ranked Ladder", "Esports Integration"],
      sports: ["Career Mode", "Online Seasons", "Local Multiplayer", "Ultimate Team"],
      sandbox: ["Creative Mode", "Multiplayer Servers", "Mod Support", "Survival Mode"]
    };
    return features[category] || features.fps;
  }

  function getScreenshots(gameName) {
    return [
      `/api/placeholder/800/450`,
      `/api/placeholder/800/450`,
      `/api/placeholder/800/450`,
      `/api/placeholder/800/450`
    ];
  }

  const handleLaunch = async () => {
    setLocalLaunching(true);
    
    try {
      if (game.executablePath) {
        console.log(`🎮 Attempting to launch ${game.name} via executable: ${game.executablePath}`);
        
        const response = await fetch('/api/launch-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameName: game.name,
            executablePath: game.executablePath
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert(`✅ ${game.name} is launching!`);
            if (onLaunch) onLaunch(game);
            return;
          } else {
            console.warn('Backend launch failed:', result.message);
          }
        }
      }

      if (game.launchUrl) {
        console.log(`🚀 Launching ${game.name} via URL protocol: ${game.launchUrl}`);
        
        try {
          window.location.href = game.launchUrl;
          
          setTimeout(() => {
            alert(`🚀 Launching ${game.name} via ${
              game.launchUrl.includes('steam') ? 'Steam' :
              game.launchUrl.includes('battlenet') ? 'Battle.net' :
              game.launchUrl.includes('epicgames') ? 'Epic Games' :
              game.launchUrl.includes('valorant') ? 'Valorant Client' :
              game.launchUrl.includes('league-of-legends') ? 'League Client' :
              'Game Launcher'
            }!`);
          }, 1000);
          
          if (onLaunch) onLaunch(game);
          return;
        } catch (error) {
          console.error('URL protocol launch failed:', error);
        }
      }

      const fallbackUrls = {
        "Fortnite": "https://www.fortnite.com/",
        "Minecraft": "https://www.minecraft.net/play",
        "Valorant": "https://playvalorant.com/",
        "League of Legends": "https://www.leagueoflegends.com/",
        "Counter Strike 2": "https://store.steampowered.com/app/730/Counter-Strike_2/",
        "Apex Legends": "https://store.steampowered.com/app/1172470/Apex_Legends/",
        "PUBG": "https://store.steampowered.com/app/578080/PLAYERUNKNOWNS_BATTLEGROUNDS/",
        "Rocket League": "https://store.steampowered.com/app/252950/Rocket_League/",
        "Destiny 2": "https://store.steampowered.com/app/1085660/Destiny_2/",
        "Rainbow Six Siege": "https://store.steampowered.com/app/359550/Tom_Clancys_Rainbow_Six_Siege/",
        "Overwatch": "https://overwatch.blizzard.com/",
        "Call of Duty": "https://www.callofduty.com/",
        "FIFA": "https://www.ea.com/games/fifa",
        "Battlefield": "https://www.ea.com/games/battlefield",
        "Marvel Rivals": "https://store.steampowered.com/app/2767030/Marvel_Rivals/"
      };

      if (fallbackUrls[game.name]) {
        console.log(`🌐 Opening ${game.name} web page as fallback`);
        window.open(fallbackUrls[game.name], '_blank');
        alert(`🌐 Opening ${game.name} web page. Please launch the game from there.`);
        
        if (onLaunch) onLaunch(game);
      } else {
        alert(`❌ Could not launch ${game.name}. Please start the game manually.`);
      }

    } catch (error) {
      console.error('Game launch error:', error);
      alert(`❌ Failed to launch ${game.name}: ${error.message}`);
    } finally {
      setLocalLaunching(false);
    }
  };

  const styles = {
    container: {
      width: "100%",
      backgroundColor: "#111827",
      minHeight: "100vh",
      color: "white",
      paddingBottom: "2rem"
    },
    header: {
      position: "relative",
      height: "400px",
      overflow: "hidden"
    },
    headerImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    headerOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(transparent 30%, rgba(17, 24, 39, 0.8) 70%, #111827 100%)"
    },
    backButton: {
      position: "absolute",
      top: "1.5rem",
      left: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1rem",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: "0.5rem",
      color: "white",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    headerContent: {
      position: "absolute",
      bottom: "2rem",
      left: "2rem",
      right: "2rem"
    },
    gameTitle: {
      fontSize: "3rem",
      fontWeight: "700",
      marginBottom: "1rem"
    },
    gameSubtitle: {
      fontSize: "1.25rem",
      color: "#9CA3AF",
      marginBottom: "1.5rem"
    },
    actionButtons: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    playButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "1rem 2rem",
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "0.75rem",
      fontSize: "1.125rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      minWidth: "150px",
      justifyContent: "center"
    },
    statsContainer: {
      display: "flex",
      gap: "2rem",
      alignItems: "center"
    },
    stat: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: "#D1D5DB"
    },
    content: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "2rem 1.5rem"
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "3rem",
      marginBottom: "3rem"
    },
    mainContent: {
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    },
    sidebar: {
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    },
    section: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      padding: "1.5rem"
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      marginBottom: "1rem"
    },
    sectionContent: {
      color: "#D1D5DB",
      lineHeight: "1.6"
    },
    screenshotsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.75rem",
      marginBottom: "1rem"
    },
    screenshot: {
      width: "100%",
      height: "120px",
      objectFit: "cover",
      borderRadius: "0.5rem",
      cursor: "pointer",
      transition: "transform 0.2s"
    },
    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.75rem"
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem",
      backgroundColor: "#374151",
      borderRadius: "0.5rem",
      fontSize: "0.875rem"
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid #374151"
    },
    infoLabel: {
      color: "#9CA3AF",
      fontSize: "0.875rem"
    },
    infoValue: {
      color: "white",
      fontWeight: "500"
    },
    requirementsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    },
    requirement: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem"
    },
    requirementLabel: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#10B981"
    },
    requirementText: {
      fontSize: "0.875rem",
      color: "#D1D5DB"
    },
    spinner: {
      width: "20px",
      height: "20px",
      border: "2px solid #374151",
      borderTop: "2px solid #10B981",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },
    "@keyframes spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img 
          src={game.image || "/api/placeholder/800/400"} 
          alt={game.name}
          style={styles.headerImage}
        />
        <div style={styles.headerOverlay} />
        
        <button 
          style={styles.backButton}
          onClick={onBack}
        >
          ← Back to Library
        </button>
        
        <div style={styles.headerContent}>
          <h1 style={styles.gameTitle}>{gameDetails.name}</h1>
          <p style={styles.gameSubtitle}>{gameDetails.description}</p>
          
          <div style={styles.actionButtons}>
            <button 
              style={{
                ...styles.playButton,
                backgroundColor: launching ? "#6B7280" : "#10B981",
                cursor: launching ? "not-allowed" : "pointer"
              }}
              onClick={handleLaunch}
              disabled={launching}
            >
              {launching ? (
                <>
                  <div style={styles.spinner} />
                  Launching...
                </>
              ) : (
                <>
                  ▶ Play Now
                </>
              )}
            </button>
            
            <div style={styles.statsContainer}>
              <div style={styles.stat}>
                👥 {gameDetails.playerCount} online
              </div>
              <div style={styles.stat}>
                ⭐ {gameDetails.rating} ({gameDetails.reviews} reviews)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.contentGrid}>
          <div style={styles.mainContent}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>About {gameDetails.name}</h2>
              <div style={styles.sectionContent}>
                <p>{gameDetails.description}</p>
                <p style={{ marginTop: "1rem" }}>
                  Experience the ultimate {gameDetails.category} gaming with cutting-edge graphics, 
                  competitive gameplay, and a thriving community of players worldwide.
                </p>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Screenshots</h2>
              <div style={styles.screenshotsGrid}>
                {gameDetails.screenshots.map((screenshot, index) => (
                  <img
                    key={index}
                    src={screenshot}
                    alt={`${gameDetails.name} screenshot ${index + 1}`}
                    style={styles.screenshot}
                  />
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>System Requirements</h2>
              <div style={styles.requirementsList}>
                <div style={styles.requirement}>
                  <div style={styles.requirementLabel}>Minimum:</div>
                  <div style={styles.requirementText}>{gameDetails.systemRequirements.minimum}</div>
                </div>
                <div style={styles.requirement}>
                  <div style={styles.requirementLabel}>Recommended:</div>
                  <div style={styles.requirementText}>{gameDetails.systemRequirements.recommended}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.sidebar}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Game Info</h3>
              <div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Publisher</span>
                  <span style={styles.infoValue}>{gameDetails.publisher}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Developer</span>
                  <span style={styles.infoValue}>{gameDetails.developer}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Release Date</span>
                  <span style={styles.infoValue}>{gameDetails.releaseDate}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Size</span>
                  <span style={styles.infoValue}>{gameDetails.size}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Last Updated</span>
                  <span style={styles.infoValue}>{gameDetails.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Features</h3>
              <div style={styles.featuresGrid}>
                {gameDetails.features.map((feature, index) => (
                  <div key={index} style={styles.feature}>
                    🎮 {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}