import React, { useState, useEffect } from "react";
import "./CreditsDisplay.scss";

interface CreditsDisplayProps {
  onClick?: () => void;
}

interface CreditsData {
  remaining: number;
  total: number;
  planName: string;
  percentage: number;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ onClick }) => {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchCredits, 30000);
    
    // Escutar evento de atualização de créditos
    const handleCreditsUpdate = () => {
      console.log("🔄 Atualizando créditos após consumo...");
      fetchCredits();
    };
    
    window.addEventListener('jazzup-credits-updated', handleCreditsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('jazzup-credits-updated', handleCreditsUpdate);
    };
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      // Buscar dados do usuário no localStorage
      const userEmail = localStorage.getItem("jazzup_user_email");

      if (!userEmail) {
        console.warn("⚠️ Email do usuário não encontrado no localStorage");
        setError("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Buscar créditos da API do Prodify
      const response = await fetch(
        `http://localhost:8001/api/external/jazzup/credits?email=${encodeURIComponent(userEmail)}`,
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar créditos: ${response.status}`);
      }

      const data = await response.json();
      setCredits(data);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao buscar créditos:", err);
      setError("Erro ao carregar créditos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!credits) return "gray";
    if (credits.percentage > 50) return "green";
    if (credits.percentage > 20) return "yellow";
    return "red";
  };

  if (error && !credits) {
    return (
      <div className="credits-display credits-error" onClick={onClick}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="credits-text">--</span>
      </div>
    );
  }

  return (
    <div
      className={`credits-display credits-${getStatusColor()}`}
      onClick={onClick}
      title={
        credits
          ? `${credits.remaining} de ${credits.total} pontos (${credits.planName})`
          : "Carregando..."
      }
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
      <span className="credits-text">
        {loading ? "..." : credits ? credits.remaining : "--"}
      </span>
      {credits && (
        <div className="credits-bar">
          <div
            className="credits-bar-fill"
            style={{ width: `${credits.percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

