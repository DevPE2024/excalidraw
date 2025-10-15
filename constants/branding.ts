// constants/branding.ts

export const APP_CONFIG = {
  // Nome do App
  APP_NAME: "Affinify Canvas",
  APP_FULL_NAME: "Affinify Canvas by Affinify",
  
  // Empresa
  COMPANY_NAME: "Affinify",
  COMPANY_WEBSITE: "https://affinify.com",
  
  // Versão
  VERSION: "1.0.0",
  
  // IA Config - Multi-Provider
  AI_ENABLED: true,
  
  // Azure GPT-4o (Principal) - Use environment variables
  AZURE_GPT4O_ENDPOINT: import.meta.env.VITE_APP_AZURE_GPT4O_ENDPOINT || "https://affinify-foundry-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview",
  AZURE_GPT4O_KEY: import.meta.env.VITE_APP_AZURE_GPT4O_KEY || "",
  
  // Azure FLUX (Imagens) - Use environment variables
  AZURE_FLUX_ENDPOINT: import.meta.env.VITE_APP_AZURE_FLUX_ENDPOINT || "https://affinify-foundry-resource.services.ai.azure.com/openai/deployments/FLUX.1-Kontext-pro/images/generations?api-version=2025-04-01-preview",
  AZURE_FLUX_KEY: import.meta.env.VITE_APP_AZURE_FLUX_KEY || "",
  
  // LiteLLM - Gemini (Alternativo)
  LITELLM_ENDPOINT: "http://localhost:4000/v1/chat/completions",
  LITELLM_KEY: "sk-p6rDmsVFrNoMNSnEckUKnA",
  LITELLM_MODEL: "vertex_ai/gemini-2.5-flash-lite",
  
  // Cores da Marca
  COLORS: {
    primary: "#6965db",
    secondary: "#4dabf7",
    accent: "#f59f00",
    success: "#51cf66",
    error: "#ff6b6b",
  },
};

export const BRANDING = {
  logoPath: "/favicon.svg",
  faviconPath: "/favicon.ico",
  tagline: "Design Colaborativo com IA",
  footer: `© ${new Date().getFullYear()} Affinify. Todos os direitos reservados.`,
};

