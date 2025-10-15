// components/Affinify/AffinifyHeader.tsx

import React from 'react';
import { APP_CONFIG, BRANDING } from '../../../constants/branding';
import './AffinifyHeader.scss';

export const AffinifyHeader: React.FC = () => {
  return (
    <header className="affinify-header">
      <div className="affinify-logo">
        <img 
          src={BRANDING.logoPath} 
          alt={APP_CONFIG.APP_NAME}
          className="logo-image"
        />
        <div className="logo-text">
          <h1>{APP_CONFIG.APP_NAME}</h1>
          <span className="company">by {APP_CONFIG.COMPANY_NAME}</span>
        </div>
      </div>
      
      <div className="affinify-tagline">
        {BRANDING.tagline}
      </div>
      
      <div className="affinify-ai-badge">
        🤖 IA Ativa
      </div>
    </header>
  );
};

