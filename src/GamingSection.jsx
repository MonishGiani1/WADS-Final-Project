import { useState } from "react";
import valorantImg from "./assets/valorant.png";
import cs2Img from "./assets/cs2.jpg";
import apexImg from "./assets/apex.jpg"; // Example for Apex Legends
import fortniteImg from "./assets/fortnite.jpg"; // Example for Fortnite
import minecraftImg from "./assets/minecraft.jpg"; // Example for Minecraft
import marvelRivalsImg from "./assets/marvel_rivals.jpg"; // Example for Marvel Rivals
import overwatchImg from "./assets/overwatch.jpg"; // Example for Overwatch
import rainbowSixImg from "./assets/rainbow_six.jpg"; // Example for Rainbow Six
import leagueOfLegendsImg from "./assets/league_of_legends.jpg"; // Example for League of Legends
import codImg from "./assets/cod.jpg"; // Example for Call of Duty
import fifaImg from "./assets/fifa.jpg"; // Example for FIFA
import pubgImg from "./assets/pubg.jpg"; // Example for PUBG
import rocketLeagueImg from "./assets/rocket_league.jpg"; // Example for Rocket League
import destiny2Img from "./assets/destiny2.jpg"; // Example for Destiny 2
import battlefieldImg from "./assets/battlefield.jpg"; // Example for Battlefield


const games = [
  { name: "Valorant", image: valorantImg },
  { name: "Counter Strike 2", image: cs2Img },
  { name: "Apex Legends", image: apexImg },
  { name: "Fortnite", image: fortniteImg },
  { name: "Minecraft", image: minecraftImg },
  { name: "Marvel Rivals", image: marvelRivalsImg },
  { name: "Overwatch", image: overwatchImg },
  { name: "Rainbow Six Siege", image: rainbowSixImg },
  { name: "League of Legends", image: leagueOfLegendsImg },
  { name: "Call of Duty", image: codImg },
  { name: "FIFA", image: fifaImg },
  { name: "PUBG", image: pubgImg },
  { name: "Rocket League", image: rocketLeagueImg },
  { name: "Destiny 2", image: destiny2Img },
  { name: "Battlefield", image: battlefieldImg },
];

export default function GamingSection() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-900 text-white gap-x-12 relative">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-45" : "w-0 overflow-hidden"
        } bg-gray-800 p-6`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 text-xl bg-gray-800 p-5 rounded-full hover:cursor-pointer"
          style={{ fontSize: "35px" }}
        >
          ☰
        </button>
  
        {/* Only show nav if sidebar is open */}
        {sidebarOpen && (
          <nav className="absolute top-32 left-0 w-full space-y-10 px-4">
            <button className="flex items-center !mb-5 gap-4 text-left hover:cursor-pointer">
              <span style={{ fontSize: "25px" }}>🎮</span>
              <span style={{ fontSize: "25px" }}>Gaming</span>
            </button>
            <button className="flex items-center !mb-5 gap-4 text-left hover:cursor-pointer">
              <span style={{ fontSize: "25px" }}>🍔</span>
              <span style={{ fontSize: "25px" }}>Food</span>
            </button>
            <button className="flex items-center !mb-5 gap-4 text-left hover:cursor-pointer">
              <span style={{ fontSize: "25px" }}>💳</span>
              <span style={{ fontSize: "25px" }}>Quota</span>
            </button>
            <button className="flex items-center !mb-5 gap-4 text-left mt-10 hover:cursor-pointer">
              <span style={{ fontSize: "25px" }}>⚙️</span>
              <span style={{ fontSize: "25px" }}>Settings</span>
            </button>
          </nav>
        )}
      </div>
  
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto items-center justify-center">
        <h1 className="text-[50px] font-bold !mt-4 !mb-6 text-center" style={{ fontSize: "35px" }}>Available Games</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <div
              key={index}
              className="bg-gray-700 rounded-2xl shadow p-4 hover:bg-gray-600 transition hover:cursor-pointer"
            >
              <img
                src={game.image}
                alt={game.name}
                className="rounded-lg mb-3 w-full h-40 object-cover"
              />
              <h2 className="text-xl font-semibold text-center">
                {game.name}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
