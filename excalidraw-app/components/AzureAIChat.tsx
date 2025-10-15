/**
 * Azure AI Chat Component
 * Provides GPT-4o powered chat interface for Affinify Canvas
 */

import { useState, useRef, useEffect } from "react";
import { azureGPT4O, type AzureGPT4OMessage } from "../services/azureAI";

import "./AzureAIChat.scss";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface AzureAIChatProps {
  onClose?: () => void;
  onGenerateDiagram?: (data: string) => void;
}

export const AzureAIChat = ({ onClose, onGenerateDiagram }: AzureAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Olá! Sou o assistente AI da Affinify Canvas. Como posso ajudar você hoje?\n\n💡 Posso:\n- Criar diagramas a partir de descrições\n- Ajudar com ideias e sugestões\n- Responder perguntas sobre o Canvas",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages: AzureGPT4OMessage[] = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      apiMessages.push({
        role: "user",
        content: input.trim(),
      });

      const response = await azureGPT4O.chat({
        messages: [
          {
            role: "system",
            content: `Você é um assistente inteligente do Affinify Canvas.
Ajude os usuários com:
- Criação de diagramas e desenhos
- Sugestões criativas
- Melhores práticas de design
- Responda sempre em português de forma clara e amigável.`,
          },
          ...apiMessages,
        ],
        max_tokens: 2000,
        temperature: 0.8,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.choices[0].message.content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Erro ao processar sua mensagem: ${error.message}\n\nPor favor, tente novamente.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateDiagram = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const diagramData = await azureGPT4O.generateDiagramFromText(input.trim());
      
      if (onGenerateDiagram) {
        onGenerateDiagram(diagramData);
      }

      const successMessage: Message = {
        id: `success-${Date.now()}`,
        role: "assistant",
        content: "✅ Diagrama gerado com sucesso!",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, successMessage]);
      setInput("");
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Erro ao gerar diagrama: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="azure-ai-chat">
      <div className="azure-ai-chat__header">
        <div className="azure-ai-chat__title">
          <span className="azure-ai-chat__icon">🤖</span>
          <span>Affinify AI Assistant</span>
        </div>
        {onClose && (
          <button
            className="azure-ai-chat__close"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      <div className="azure-ai-chat__messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`azure-ai-chat__message azure-ai-chat__message--${message.role}`}
          >
            <div className="azure-ai-chat__message-content">
              {message.content}
            </div>
            <div className="azure-ai-chat__message-time">
              {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="azure-ai-chat__message azure-ai-chat__message--assistant">
            <div className="azure-ai-chat__message-content">
              <div className="azure-ai-chat__loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="azure-ai-chat__input-container">
        <textarea
          className="azure-ai-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          rows={3}
          disabled={isLoading}
        />
        <div className="azure-ai-chat__actions">
          <button
            className="azure-ai-chat__button azure-ai-chat__button--secondary"
            onClick={handleGenerateDiagram}
            disabled={isLoading || !input.trim()}
            title="Gerar diagrama a partir do texto"
          >
            🎨 Gerar Diagrama
          </button>
          <button
            className="azure-ai-chat__button azure-ai-chat__button--primary"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
};

