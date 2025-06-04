import { useState, useEffect } from "react";
import GameDetailPage from "./GameDetailPage";

import valorantImg from "./assets/valorant.png";
import csImg from "./assets/cs2.jpg";
import apexImg from "./assets/apex.jpg";
import fortniteImg from "./assets/fortnite.jpg";
import minecraftImg from "./assets/minecraft.jpg";
import marvelRivalsImg from "./assets/marvel_rivals.jpg";
import overwatchImg from "./assets/overwatch.jpg";
import rainbowSixImg from "./assets/rainbow_six.jpg";
import leagueImg from "./assets/league_of_legends.jpg";
import codImg from "./assets/cod.jpg";
import fifaImg from "./assets/fifa.jpg";
import pubgImg from "./assets/pubg.jpg";
import rocketLeagueImg from "./assets/rocket_league.jpg";
import destinyImg from "./assets/destiny2.jpg";
import battlefieldImg from "./assets/battlefield.jpg";

export default function GamingSection() {
  const [hoveredGame, setHoveredGame] = useState(null);
  const [featuredGameIndex, setFeaturedGameIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [imageErrors, setImageErrors] = useState({});
  const [playerCounts, setPlayerCounts] = useState({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentView, setCurrentView] = useState("library");

  const fallbackImage = "/api/placeholder/480/320";

  const categories = [
    { id: "all", name: "All Games" },
    { id: "fps", name: "FPS" },
    { id: "moba", name: "MOBA" },
    { id: "battle-royale", name: "Battle Royale" },
    { id: "sports", name: "Sports" },
    { id: "sandbox", name: "Sandbox" }
  ];

  const baseGames = [
    { 
      id: 1,
      name: "Valorant", 
      category: "fps",
      description: "5v5 tactical shooter with unique agent abilities",
      defaultPlayerCount: "247,592",
      popularityRank: 3,
      image: valorantImg
    },
    { 
      id: 2,
      name: "Counter Strike 2", 
      category: "fps",
      description: "Classic tactical FPS with modern graphics and physics",
      defaultPlayerCount: "894,320",
      popularityRank: 1,
      image: csImg 
    },
    { 
      id: 3,
      name: "Apex Legends", 
      category: "battle-royale",
      description: "Fast-paced battle royale with hero abilities",
      defaultPlayerCount: "231,457",
      popularityRank: 5,
      image: apexImg 
    },
    { 
      id: 4,
      name: "Fortnite", 
      category: "battle-royale",
      description: "Battle royale with building mechanics",
      defaultPlayerCount: "354,872",
      popularityRank: 2,
      image: fortniteImg 
    },
    { 
      id: 5,
      name: "Minecraft", 
      category: "sandbox",
      description: "Build anything in this blocky sandbox world",
      defaultPlayerCount: "142,365",
      popularityRank: 8,
      image: minecraftImg 
    },
    { 
      id: 6,
      name: "Marvel Rivals", 
      category: "fps",
      description: "Hero shooter featuring Marvel characters",
      defaultPlayerCount: "132,754",
      popularityRank: 10,
      image: marvelRivalsImg 
    },
    { 
      id: 7,
      name: "Overwatch", 
      category: "fps",
      description: "Team-based hero shooter with diverse characters",
      defaultPlayerCount: "178,532",
      popularityRank: 7,
      image: overwatchImg 
    },
    { 
      id: 8,
      name: "Rainbow Six Siege", 
      category: "fps",
      description: "Tactical shooter focusing on teamwork and destruction",
      defaultPlayerCount: "125,478",
      popularityRank: 11,
      image: rainbowSixImg 
    },
    { 
      id: 9,
      name: "League of Legends", 
      category: "moba",
      description: "Competitive MOBA with over 150 champions",
      defaultPlayerCount: "365,214",
      popularityRank: 4,
      image: leagueImg 
    },
    { 
      id: 10,
      name: "Call of Duty", 
      category: "fps",
      description: "Fast-paced military shooter series",
      defaultPlayerCount: "243,865",
      popularityRank: 6,
      image: codImg 
    },
    { 
      id: 11,
      name: "FIFA", 
      category: "sports",
      description: "The world's most popular football simulation",
      defaultPlayerCount: "134,785",
      popularityRank: 9,
      image: fifaImg 
    },
    { 
      id: 12,
      name: "PUBG", 
      category: "battle-royale",
      description: "Realistic battle royale with military-style gameplay",
      defaultPlayerCount: "118,457",
      popularityRank: 12,
      image: pubgImg 
    },
    { 
      id: 13,
      name: "Rocket League", 
      category: "sports",
      description: "Soccer with rocket-powered cars",
      defaultPlayerCount: "95,321",
      popularityRank: 13,
      image: rocketLeagueImg 
    },
    { 
      id: 14,
      name: "Destiny 2", 
      category: "fps",
      description: "Sci-fi FPS with MMO elements",
      defaultPlayerCount: "85,264",
      popularityRank: 14,
      image: destinyImg 
    },
    { 
      id: 15,
      name: "Battlefield", 
      category: "fps",
      description: "Large-scale military warfare with vehicles",
      defaultPlayerCount: "76,198",
      popularityRank: 15,
      image: battlefieldImg 
    },
  ];

  const games = baseGames.map(game => ({
    ...game,
    playerCount: playerCounts[game.name] || game.defaultPlayerCount
  }));

  useEffect(() => {
    const fetchPlayerCounts = async () => {
      try {
        setIsLoadingCounts(true);
        const response = await fetch('/api/player-counts');
        if (!response.ok) throw new Error('Failed to fetch player counts');
        
        const data = await response.json();
        setPlayerCounts(data);
      } catch (error) {
        console.error('Error fetching player counts:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    };

    fetchPlayerCounts();
    
    const intervalId = setInterval(fetchPlayerCounts, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFeaturedGameIndex(prevIndex => 
        prevIndex === games.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [games.length]);

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || game.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredGame = games[featuredGameIndex];
  
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setCurrentView("detail");
  };

  const handleLaunchGame = (game) => {
    alert(`Launching ${game.name}! Get ready to play.`);
  };

  const handleBackToLibrary = () => {
    setSelectedGame(null);
    setCurrentView("library");
  };

  const handleImageError = (gameId) => {
    setImageErrors(prev => ({
      ...prev,
      [gameId]: true
    }));
  };

  if (currentView === "detail" && selectedGame) {
    return (
      <GameDetailPage
        game={selectedGame}
        onBack={handleBackToLibrary}
        onLaunch={handleLaunchGame}
      />
    );
  }

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
    featuredSection: {
      marginBottom: "2.5rem",
      position: "relative",
      borderRadius: "1rem",
      overflow: "hidden",
      height: "300px"
    },
    featuredImage: {
      width: "100%",
      height: "300px",
      objectFit: "cover",
      borderRadius: "1rem"
    },
    featuredOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      background: "linear-gradient(transparent, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.95))",
      padding: "2rem",
      borderRadius: "0 0 1rem 1rem"
    },
    featuredTitle: {
      fontSize: "2rem",
      fontWeight: "700",
      marginBottom: "0.5rem"
    },
    featuredDescription: {
      fontSize: "1rem",
      marginBottom: "1rem",
      opacity: "0.8"
    },
    featuredButton: {
      backgroundColor: "#10B981",
      color: "white",
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s",
      display: "inline-block"
    },
    featuredStats: {
      position: "absolute",
      top: "1rem",
      right: "1rem",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: "0.5rem 1rem",
      borderRadius: "2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    liveIndicator: {
      display: "inline-block",
      width: "8px",
      height: "8px",
      backgroundColor: "#10B981",
      borderRadius: "50%",
      marginRight: "8px",
      animation: "pulse 1.5s infinite"
    },
    searchAndFilterSection: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "2rem",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "1rem"
    },
    searchInput: {
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid #374151",
      backgroundColor: "#1F2937",
      color: "white",
      width: "100%",
      maxWidth: "320px"
    },
    categoryContainer: {
      display: "flex",
      overflowX: "auto",
      gap: "0.75rem",
      padding: "0.5rem 0",
      maxWidth: "100%"
    },
    categoryButton: {
      padding: "0.5rem 1.5rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: "500",
      transition: "all 0.3s",
      cursor: "pointer",
      whiteSpace: "nowrap"
    },
    gamesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "1.5rem"
    },
    gameCard: {
      backgroundColor: "#1F2937",
      borderRadius: "1rem",
      overflow: "hidden",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer"
    },
    gameCardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
    },
    gameImage: {
      width: "100%",
      height: "160px",
      objectFit: "cover"
    },
    gameContent: {
      padding: "1rem"
    },
    gameName: {
      fontSize: "1.25rem",
      fontWeight: "700",
      marginBottom: "0.5rem"
    },
    gameDescription: {
      fontSize: "0.875rem",
      color: "#9CA3AF",
      marginBottom: "1rem",
      height: "40px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    },
    gameFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    gameCategory: {
      fontSize: "0.75rem",
      padding: "0.25rem 0.75rem",
      backgroundColor: "#374151",
      borderRadius: "9999px",
      display: "inline-block"
    },
    gamePlayerCount: {
      fontSize: "0.875rem",
      color: "#9CA3AF",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem"
    },
    noResults: {
      textAlign: "center",
      padding: "3rem 0",
      fontSize: "1.25rem",
      color: "#9CA3AF"
    },
    "@keyframes pulse": {
      "0%": { opacity: 0.6 },
      "50%": { opacity: 1 },
      "100%": { opacity: 0.6 }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <h1 style={styles.heading}>Game Library</h1>
        
        {featuredGame && (
          <div style={styles.featuredSection}>
            <img 
              src={imageErrors[featuredGame.id] ? fallbackImage : featuredGame.image} 
              alt={featuredGame.name} 
              style={styles.featuredImage}
              onError={() => handleImageError(featuredGame.id)}
            />
            <div style={styles.featuredOverlay}>
              <h2 style={styles.featuredTitle}>{featuredGame.name}</h2>
              <p style={styles.featuredDescription}>{featuredGame.description}</p>
              <button 
                style={styles.featuredButton}
                onClick={() => handleGameSelect(featuredGame)}
              >
                View Details
              </button>
            </div>
            <div style={styles.featuredStats}>
              <div style={styles.liveIndicator}></div>
              <span>{featuredGame.playerCount} players online</span>
              {isLoadingCounts && <span> (updating...)</span>}
            </div>
          </div>
        )}
        
        <div style={styles.searchAndFilterSection}>
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          
          <div style={styles.categoryContainer}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                style={{
                  ...styles.categoryButton,
                  backgroundColor: filterCategory === category.id ? "#10B981" : "#374151",
                  color: filterCategory === category.id ? "white" : "#D1D5DB"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {filteredGames.length > 0 ? (
          <div style={styles.gamesGrid}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                style={{
                  ...styles.gameCard,
                  ...(hoveredGame === game.id ? styles.gameCardHover : {})
                }}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
                onClick={() => handleGameSelect(game)}
              >
                <img
                  src={imageErrors[game.id] ? fallbackImage : game.image}
                  alt={game.name}
                  style={styles.gameImage}
                  onError={() => handleImageError(game.id)}
                />
                <div style={styles.gameContent}>
                  <h3 style={styles.gameName}>{game.name}</h3>
                  <p style={styles.gameDescription}>{game.description}</p>
                  <div style={styles.gameFooter}>
                    <span style={styles.gameCategory}>
                      {categories.find(cat => cat.id === game.category)?.name || game.category}
                    </span>
                    <span style={styles.gamePlayerCount}>
                      <div style={styles.liveIndicator}></div>
                      {game.playerCount} players
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            No games found matching your search. Try a different query.
          </div>
        )}
      </div>
    </div>
  );
}