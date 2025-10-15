// components/AI/AIAssistant.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { ChatMessage } from '../../services/ai/litellm.service';
import { insertImageIntoCanvas, getCanvasCenter } from '../../utils/canvasHelpers';
import './AIAssistant.scss';

export interface AIAssistantProps {
  excalidrawAPI?: any; // Referência da API Excalidraw
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ excalidrawAPI }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    isLoading, 
    error, 
    sendMessage,
    generateImage,
    improvePrompt,
    availableImageModels 
  } = useAI();

  // Selecionar primeiro modelo disponível
  useEffect(() => {
    if (availableImageModels.length > 0 && !selectedImageModel) {
      setSelectedImageModel(availableImageModels[0]);
    }
  }, [availableImageModels, selectedImageModel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Detectar se mensagem é comando de geração de imagem
   */
  const isImageGenerationCommand = (text: string): boolean => {
    const imageKeywords = [
      'gerar imagem',
      'criar imagem',
      'desenhar',
      'ilustrar',
      'criar uma imagem',
      'gerar uma imagem',
      'fazer imagem',
      'imagem de',
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
  };

  /**
   * Extrair prompt de comando de imagem
   */
  const extractImagePrompt = (text: string): string => {
    // Remover palavras de comando
    let prompt = text
      .replace(/gerar\s+(uma\s+)?imagem\s+(de|com)?/gi, '')
      .replace(/criar\s+(uma\s+)?imagem\s+(de|com)?/gi, '')
      .replace(/desenhar/gi, '')
      .replace(/ilustrar/gi, '')
      .replace(/fazer\s+imagem\s+(de|com)?/gi, '')
      .trim();
    
    return prompt || text;
  };

  /**
   * Handler de geração de imagem
   */
  const handleImageGeneration = async (commandText: string) => {
    setIsGeneratingImage(true);

    try {
      // 1. Extrair prompt
      let prompt = extractImagePrompt(commandText);
      
      // 2. Melhorar prompt com IA (opcional)
      const assistantMessage1: ChatMessage = {
        role: 'assistant',
        content: `🎨 Vou gerar uma imagem: "${prompt}"\n\nOtimizando prompt...`,
      };
      setMessages(prev => [...prev, assistantMessage1]);

      const improvedPrompt = await improvePrompt(prompt);
      
      const assistantMessage2: ChatMessage = {
        role: 'assistant',
        content: `✨ Prompt otimizado: "${improvedPrompt}"\n\nGerando imagem...`,
      };
      setMessages(prev => [...prev, assistantMessage2]);

      // 3. Gerar imagem
      const imageUrl = await generateImage({
        prompt: improvedPrompt,
        model: selectedImageModel,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      // 4. Inserir no canvas
      if (excalidrawAPI) {
        const center = getCanvasCenter(excalidrawAPI);
        
        await insertImageIntoCanvas(excalidrawAPI, imageUrl, {
          x: center.x,
          y: center.y,
          width: 800,
          height: 800,
        });

        const successMessage: ChatMessage = {
          role: 'assistant',
          content: `✅ Imagem gerada e adicionada ao canvas!\n\nModelo usado: ${selectedImageModel}`,
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        // Apenas mostrar preview se não tiver API do canvas
        const previewMessage: ChatMessage = {
          role: 'assistant',
          content: `✅ Imagem gerada!\n\n⚠️ Canvas não conectado. Arraste a imagem manualmente.`,
        };
        setMessages(prev => [...prev, previewMessage]);
      }

    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Erro ao gerar imagem: ${err.message}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  /**
   * Handler melhorado para enviar mensagem ou gerar imagem
   */
  const handleSend = async () => {
    console.log('🚀 handleSend CHAMADO - Início da função');
    if (!input.trim() || isLoading || isGeneratingImage) {
      console.log('⚠️ Retornando: input vazio ou loading');
      return;
    }

    // ========== CONSUMO DE PONTOS AFFINIFY ==========
    console.log('💰 Iniciando consumo de pontos...');
    const userEmail = localStorage.getItem("jazzup_user_email");
    console.log('📧 Email do usuário:', userEmail);
    
    if (!userEmail) {
      alert("Você precisa estar autenticado para usar a IA. Por favor, acesse pelo Prodify.");
      return;
    }

    try {
      // Consumir 1 ponto antes de enviar
      const creditResponse = await fetch("http://localhost:8001/api/external/jazzup/use-credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const creditData = await creditResponse.json();

      if (creditResponse.status === 402) {
        // Créditos insuficientes
        alert(`Créditos insuficientes! Você precisa de ${creditData.required} ponto(s), mas tem apenas ${creditData.remaining}. Faça upgrade do seu plano no Prodify.`);
        return;
      }

      if (!creditResponse.ok) {
        throw new Error(creditData.error || "Erro ao consumir créditos");
      }

      console.log(`✅ ${creditData.pointsUsed} ponto(s) consumido(s). Pontos restantes: ${creditData.remaining}`);
      
      // Disparar evento para atualizar o display de créditos
      window.dispatchEvent(new CustomEvent('jazzup-credits-updated'));
    } catch (error) {
      console.error("❌ Erro ao consumir créditos:", error);
      alert("Erro ao processar sua solicitação. Tente novamente.");
      return;
    }
    // ========== FIM DO CONSUMO DE PONTOS ==========

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      // Verificar se é comando de geração de imagem
      if (isImageGenerationCommand(currentInput)) {
        await handleImageGeneration(currentInput);
      } else {
        // Chat normal
        const response = await sendMessage([...messages, userMessage]);
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <h3>Affinify Assistant</h3>
        </div>
        <div className={`ai-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Conectado' : '○ Desconectado'}
        </div>
      </div>

      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <p>👋 Olá! Sou o assistente do Affinify Canvas.</p>
            <p>Como posso ajudar você a criar designs incríveis hoje?</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`ai-message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message assistant">
            <div className="message-content loading">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="ai-error">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Seletor de modelo de imagem */}
      {availableImageModels.length > 0 && (
        <div className="ai-model-selector">
          <label>🎨 Modelo de Imagem:</label>
          <select 
            value={selectedImageModel}
            onChange={(e) => setSelectedImageModel(e.target.value)}
            disabled={isLoading || isGeneratingImage}
          >
            {availableImageModels.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status de geração */}
      {isGeneratingImage && (
        <div className="generating-status">
          🎨 Gerando imagem... Isso pode levar até 30 segundos.
        </div>
      )}

      <div className="ai-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem ou comando de imagem..."
          disabled={!isConnected || isLoading || isGeneratingImage}
          rows={2}
        />
        <button 
          onClick={handleSend}
          disabled={!isConnected || isLoading || isGeneratingImage || !input.trim()}
          className="send-button"
        >
          {isLoading || isGeneratingImage ? '⏳' : '📤'} Enviar
        </button>
      </div>
    </div>
  );
};

