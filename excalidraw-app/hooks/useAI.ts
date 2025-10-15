// hooks/useAI.ts

import { useState, useEffect } from 'react';
import { 
  liteLLMService, 
  ChatMessage, 
  ImageGenerationRequest,
  ImageGenerationResponse 
} from '../services/ai/litellm.service';

export const useAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);

  // Testar conexão ao montar
  useEffect(() => {
    testConnection();
    loadImageModels();
  }, []);

  const loadImageModels = async () => {
    try {
      const models = await liteLLMService.getAvailableImageModels();
      setAvailableImageModels(models);
    } catch (err) {
      console.error('Erro ao carregar modelos de imagem:', err);
    }
  };

  const testConnection = async () => {
    try {
      const connected = await liteLLMService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        const models = await liteLLMService.listModels();
        setAvailableModels(models);
      }
    } catch (err) {
      setError('Erro ao conectar com IA');
      console.error(err);
    }
  };

  const sendMessage = async (messages: ChatMessage[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await liteLLMService.sendMessage(messages);
      return response.choices[0].message.content;
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestion = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const suggestion = await liteLLMService.generateDesignSuggestion(prompt);
      return suggestion;
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar sugestão');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const improvePrompt = async (userPrompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const improved = await liteLLMService.improveImagePrompt(userPrompt);
      return improved;
    } catch (err: any) {
      setError(err.message || 'Erro ao melhorar prompt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (request: ImageGenerationRequest): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await liteLLMService.generateImage(request);
      
      // Retornar URL ou base64
      const imageData = response.data[0];
      
      if (imageData.url) {
        return imageData.url;
      } else if (imageData.b64_json) {
        return `data:image/png;base64,${imageData.b64_json}`;
      }
      
      throw new Error('Nenhuma imagem retornada');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar imagem';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    availableModels,
    availableImageModels, // Novo
    testConnection,
    sendMessage,
    generateSuggestion,
    improvePrompt,
    generateImage, // Novo
  };
};

