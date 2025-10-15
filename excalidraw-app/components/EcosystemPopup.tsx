import React from "react";
import "./EcosystemPopup.scss";

interface EcosystemApp {
  name: string;
  description: string;
  url: string;
  gradient: string;
  icon: string;
}

const ecosystemApps: EcosystemApp[] = [
  {
    name: "Prodify",
    description: "Task Management & Productivity",
    url: "http://localhost:8001/en",
    gradient: "from-purple-500 via-blue-500 to-pink-500",
    icon: "P",
  },
  {
    name: "OnScope",
    description: "Visual Web Editor",
    url: "http://localhost:8002/en",
    gradient: "from-red-500 via-orange-500 to-pink-500",
    icon: "O",
  },
  {
    name: "JazzUp",
    description: "Collaborative Canvas",
    url: "http://localhost:5173",
    gradient: "from-blue-400 via-cyan-400 to-green-400",
    icon: "J",
  },
  {
    name: "DeepQuest",
    description: "AI-Powered Search Engine",
    url: "http://localhost:3001",
    gradient: "from-purple-600 via-blue-600 to-pink-600",
    icon: "D",
  },
  {
    name: "OpenUIX",
    description: "AI Interface Platform",
    url: "http://localhost:5050",
    gradient: "from-pink-500 via-yellow-500 to-blue-500",
    icon: "O",
  },
  {
    name: "TestPath",
    description: "API Testing Tool",
    url: "http://localhost:8006/en",
    gradient: "from-teal-400 via-pink-400 to-purple-400",
    icon: "T",
  },
];

interface EcosystemPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EcosystemPopup: React.FC<EcosystemPopupProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleAppClick = (appName: string, url: string) => {
    console.log("📂 Abrindo app:", appName);
    window.open(url, "_blank");
  };

  return (
    <div className="ecosystem-popup-overlay" onClick={onClose}>
      <div
        className="ecosystem-popup-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ecosystem-popup-header">
          <div>
            <h2>Affinify Ecosystem</h2>
            <p>Choose an application to explore</p>
          </div>
          <button className="ecosystem-popup-close" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Apps Grid */}
        <div className="ecosystem-popup-content">
          <div className="ecosystem-apps-grid">
            {ecosystemApps.map((app, index) => (
              <div
                key={index}
                className={`ecosystem-app-card gradient-${app.icon.toLowerCase()}`}
                onClick={() => handleAppClick(app.name, app.url)}
              >
                <div className="app-card-content">
                  <div className="app-card-top">
                    <div className="app-icon">
                      <span>{app.icon}</span>
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="external-link"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                  <div className="app-card-bottom">
                    <h3>{app.name}</h3>
                    <p>{app.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="ecosystem-popup-footer">
          <p>
            All applications are part of the Affinify ecosystem and work
            seamlessly together
          </p>
        </div>
      </div>
    </div>
  );
};

