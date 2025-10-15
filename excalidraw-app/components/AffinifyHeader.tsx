import React, { useState, useEffect } from "react";
import { EcosystemPopup } from "./EcosystemPopup";
import { CreditsDisplay } from "./CreditsDisplay";
import "./AffinifyHeader.scss";

export const AffinifyHeader: React.FC = () => {
  const [showEcosystemPopup, setShowEcosystemPopup] = useState(false);

  // Verificar se há email do usuário no localStorage ao montar
  useEffect(() => {
    const checkUserEmail = () => {
      // Tentar obter email dos parâmetros da URL (quando vem do Prodify)
      const urlParams = new URLSearchParams(window.location.search);
      const emailFromUrl = urlParams.get("email") || urlParams.get("user_email");
      
      if (emailFromUrl) {
        localStorage.setItem("jazzup_user_email", emailFromUrl);
        console.log("📧 Email do usuário salvo:", emailFromUrl);
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Verificar se já existe no localStorage
      const storedEmail = localStorage.getItem("jazzup_user_email");
      if (!storedEmail) {
        console.warn("⚠️ Email do usuário não encontrado. Funcionalidades de créditos podem não funcionar.");
      }
    };

    checkUserEmail();
  }, []);

  const handleEcosystemClick = () => {
    setShowEcosystemPopup(true);
  };

  const handleCreditsClick = () => {
    console.log("📊 Detalhes de créditos");
    // Futuramente pode abrir um modal com mais detalhes
  };

  return (
    <>
      <div className="affinify-header">
        <button
          className="affinify-header-button ecosystem-button"
          onClick={handleEcosystemClick}
          title="Affinify Ecosystem"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
        
        <CreditsDisplay onClick={handleCreditsClick} />
      </div>

      <EcosystemPopup
        isOpen={showEcosystemPopup}
        onClose={() => setShowEcosystemPopup(false)}
      />
    </>
  );
};

