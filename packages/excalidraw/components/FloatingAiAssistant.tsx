import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Link, Code, Mic, Send, Info, Bot, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { azureGPT4O, azureFLUX, type AzureGPT4OMessage } from '../../../excalidraw-app/services/azureAI';
import type { BinaryFiles, UIAppState } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
  isImage?: boolean;
  canAddToCanvas?: boolean;
}

interface FloatingAiAssistantProps {
  appState?: UIAppState;
  files?: BinaryFiles;
  elements?: readonly any[];
}

const FloatingAiAssistant = ({ appState, files, elements }: FloatingAiAssistantProps = {}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [activeButton, setActiveButton] = useState<'chat' | 'img'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showAddToChatButton, setShowAddToChatButton] = useState(false);
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const excalidrawAPI = useRef<any>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSend = async () => {
    console.log('🚀🚀🚀 REAL FloatingAiAssistant: handleSend CHAMADO!!! 🚀🚀🚀');
    console.log('💬 Mensagem:', message);
    
    if (message.trim()) {
      console.log('✅ Mensagem válida, continuando...');
      
      // ========== CONSUMO DE PONTOS AFFINIFY ==========
      const userEmail = localStorage.getItem("jazzup_user_email");
      console.log('📧 Email do usuário:', userEmail);
      
      if (!userEmail) {
        alert("Você precisa estar autenticado para usar a IA. Por favor, acesse pelo Prodify.");
        return;
      }

      try {
        console.log('💰 Consumindo 1 ponto...');
        // Consumir pontos antes de enviar
        const creditResponse = await fetch("http://localhost:8001/api/external/jazzup/use-credit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail }),
        });

        const creditData = await creditResponse.json();
        console.log('📊 Resposta da API de créditos:', creditData);

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
      
      // Adicionar mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = message;
      setMessage('');
      setCharCount(0);
      setIsLoading(true);
      
      try {
        if (activeButton === 'img') {
          // Gerar imagem com FLUX
          const response = await azureFLUX.generateImage({
            prompt: currentMessage,
            n: 1,
            size: "1024x1024",
            output_format: "png"
          });
          
          if (response.data && response.data[0]) {
            const imageData = response.data[0];
            let imageUrl = '';
            
            if (imageData.url) {
              imageUrl = imageData.url;
            } else if (imageData.b64_json) {
              // Converter base64 para blob URL
              const blob = await azureFLUX.generateImageFromBase64(imageData.b64_json);
              imageUrl = URL.createObjectURL(blob);
            }
            
            // Adicionar imagem ao canvas do Excalidraw
            if (imageUrl) {
              try {
                // Tentar adicionar a imagem usando a API do Excalidraw
                if (excalidrawAPI.current && typeof excalidrawAPI.current.addFiles === 'function') {
                  excalidrawAPI.current.addFiles([{
                    id: `image_${Date.now()}`,
                    dataURL: imageUrl,
                    mimeType: 'image/png',
                    created: Date.now(),
                    lastRetrieved: Date.now()
                  }]);
                } else {
                  // Fallback: criar um elemento de imagem e adicionar ao DOM temporariamente
                  console.log('Excalidraw API not available, image generated but not added to canvas');
                }
              } catch (canvasError) {
                console.error('Error adding image to canvas:', canvasError);
              }
            }
            
            // Adicionar mensagem de confirmação
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: `Image generated successfully! "${currentMessage}" - Add to Canvas`,
              sender: 'ai',
              timestamp: new Date(),
              imageUrl: imageUrl,
              isImage: true,
              canAddToCanvas: true
            };
            setMessages(prev => [...prev, aiMessage]);
          } else {
            throw new Error('No image data received from FLUX');
          }
        } else {
          // Chat normal com GPT-4o
          const chatHistory: AzureGPT4OMessage[] = [
            {
              role: 'system',
              content: 'You are a helpful AI assistant integrated into JazzUp, a collaborative design tool by Affinify. You help users with their questions, provide creative suggestions, and assist with design-related tasks. Be concise, friendly, and professional.'
            },
            // Adicionar mensagens anteriores como contexto (últimas 10)
            ...messages.slice(-10).map(msg => ({
              role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.text
            })),
            // Adicionar a mensagem atual
            {
              role: 'user',
              content: currentMessage
            }
          ];
          
          // Chamar a API Azure GPT-4o
          const response = await azureGPT4O.chat({
            messages: chatHistory,
            max_tokens: 2000,
            temperature: 0.7
          });
          
          // Adicionar resposta da IA
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.choices[0].message.content,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Error processing request:', error);
        
        // Mensagem de erro amigável
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, I encountered an error while processing your request. ${error instanceof Error ? error.message : 'Please try again later.'}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddImagesToChat = async () => {
    if (selectedImages.length > 0 && appState && files && elements) {
      // Obter elementos selecionados do tipo imagem
      const selectedImageElements = elements.filter(
        (el: any) => appState.selectedElementIds[el.id] && el.type === 'image' && el.fileId
      );
      
      if (selectedImageElements.length > 0) {
        // Adicionar cada imagem selecionada ao chat
        for (const imageElement of selectedImageElements) {
          const fileId = (imageElement as any).fileId;
          const fileData = files[fileId];
          
          if (fileData && fileData.dataURL) {
            const imageMessage: Message = {
              id: Date.now().toString() + Math.random(),
              text: `Reference image added for generation`,
              sender: 'user',
              timestamp: new Date(),
              imageUrl: fileData.dataURL,
              isImage: true
            };
            
            setMessages(prev => [...prev, imageMessage]);
          }
        }
      } else {
        // Se não houver imagens selecionadas, adicionar mensagem de texto
        const textMessage: Message = {
          id: Date.now().toString(),
          text: `Added ${selectedImages.length} selected element(s) as reference (non-image elements)`,
          sender: 'user',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, textMessage]);
      }
    }
  };

  const handleAddToCanvas = async (imageUrl: string, messageId: string) => {
    try {
      // Converter o blob URL para um arquivo
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Criar um arquivo a partir do blob
      const file = new File([blob], `generated_image_${Date.now()}.png`, { type: 'image/png' });
      
      // Criar um DataTransfer para simular um drop de arquivo
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Encontrar o canvas do Excalidraw
      const excalidrawCanvas = document.querySelector('.excalidraw canvas') as HTMLCanvasElement;
      
      if (excalidrawCanvas) {
        // Simular um evento de drop no canvas
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dataTransfer
        });
        
        // Calcular uma posição aleatória no canvas para drop
        const rect = excalidrawCanvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        Object.defineProperty(dropEvent, 'clientX', { value: centerX });
        Object.defineProperty(dropEvent, 'clientY', { value: centerY });
        
        excalidrawCanvas.dispatchEvent(dropEvent);
        
        // Atualizar a mensagem para mostrar que foi adicionada
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, canAddToCanvas: false, text: msg.text.replace('Add to Canvas', 'Added to Canvas ✓') }
            : msg
        ));
      } else {
        throw new Error('Canvas not found');
      }
    } catch (error) {
      console.error('Error adding image to canvas:', error);
      
      // Mostrar mensagem de erro
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, canAddToCanvas: false, text: msg.text.replace('Add to Canvas', 'Error adding to canvas') }
          : msg
      ));
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get Excalidraw API reference
  useEffect(() => {
    const getExcalidrawAPI = () => {
      // Try to get the Excalidraw API from the global window object
      if (typeof window !== 'undefined' && (window as any).excalidrawAPI) {
        excalidrawAPI.current = (window as any).excalidrawAPI;
      }
    };

    getExcalidrawAPI();
    
    // Also try after a short delay in case the API isn't ready yet
    const timeout = setTimeout(getExcalidrawAPI, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Detect selected elements in canvas
  useEffect(() => {
    const checkSelectedElements = () => {
      // Procurar pelo heading "Ações das formas selecionadas"
      const headings = Array.from(document.querySelectorAll('h2'));
      const actionsHeading = headings.find(h => h.textContent?.includes('Ações das formas selecionadas'));
      
      if (actionsHeading && appState && elements) {
        // Contar quantas imagens estão selecionadas
        const selectedImageElements = elements.filter(
          (el: any) => appState.selectedElementIds[el.id] && el.type === 'image' && el.fileId
        );
        
        if (selectedImageElements.length > 0) {
          // Criar array com os fileIds das imagens selecionadas
          const imageFileIds = selectedImageElements.map((el: any) => el.fileId);
          setSelectedImages(imageFileIds);
          setShowAddToChatButton(true);
        } else {
          // Se há elementos selecionados mas não são imagens, mostrar o botão mesmo assim
          setSelectedImages(['non-image']);
          setShowAddToChatButton(true);
        }
      } else {
        setSelectedImages([]);
        setShowAddToChatButton(false);
      }
    };

    // Verificar a cada 300ms se há elementos selecionados
    const interval = setInterval(checkSelectedElements, 300);
    
    return () => clearInterval(interval);
  }, [appState, elements]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        // Check if the click is not on the floating button
        if (!(event.target as Element).closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Add to Chat Button - aparece embaixo da imagem selecionada */}
      {showAddToChatButton && (
        <button
          onClick={handleAddImagesToChat}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: '25px',
            background: 'linear-gradient(45deg, rgb(34, 197, 94), rgb(59, 200, 120))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 6px 20px rgba(34, 197, 94, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          Add to Chat ({selectedImages.length})
        </button>
      )}
      
    <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 50 }}>

      {/* Floating 3D Glowing AI Logo */}
      <button 
        className="floating-ai-button"
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.5s',
          transform: isChatOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.8) 100%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.7), 0 0 40px rgba(124, 58, 237, 0.5), 0 0 60px rgba(109, 40, 217, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
        }}
      >
        {/* 3D effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
          opacity: 0.3
        }}></div>
        
        {/* Inner glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)'
        }}></div>
        
        {/* AI Icon */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {isChatOpen ? <X color="white" size={32} /> : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
              <path d="M20 2v4"/>
              <path d="M22 4h-4"/>
              <circle cx="4" cy="20" r="2"/>
            </svg>
          )}
        </div>
        
        {/* Glowing animation */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          opacity: 0.2,
          background: 'rgb(99, 102, 241)',
          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
        }}></div>
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div 
          ref={chatRef}
          style={{
            position: 'absolute',
            bottom: '80px',
            right: 0,
            width: '400px',
            maxWidth: '400px',
            transition: 'all 0.3s',
            transformOrigin: 'bottom right',
            animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            maxHeight: '70vh',
            borderRadius: '24px',
            background: 'linear-gradient(to bottom right, rgba(39, 39, 42, 0.98), rgba(24, 24, 27, 0.99))',
            border: '2px solid rgba(113, 113, 122, 0.9)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(40px)',
            overflow: 'hidden',
          }}>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px 8px 24px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'rgb(34, 197, 94)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgb(161, 161, 170)'
                }}>AI Assistant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setActiveButton('chat')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: activeButton === 'chat' ? 'linear-gradient(to right, rgb(220, 38, 38), rgb(239, 68, 68))' : 'rgba(39, 39, 42, 0.6)',
                    color: activeButton === 'chat' ? 'white' : 'rgb(212, 212, 216)',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
                    <path d="M20 2v4"/>
                    <path d="M22 4h-4"/>
                    <circle cx="4" cy="20" r="2"/>
                  </svg>
                  Chat
                </button>
                <button 
                  onClick={() => setActiveButton('img')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: activeButton === 'img' ? 'linear-gradient(to right, rgb(220, 38, 38), rgb(239, 68, 68))' : 'rgba(39, 39, 42, 0.6)',
                    color: activeButton === 'img' ? 'white' : 'rgb(212, 212, 216)',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  IMG
                </button>
                {messages.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Clear chat history?')) {
                        setMessages([]);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: 'rgb(248, 113, 113)',
                      borderRadius: '16px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                )}
                <button 
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    padding: '6px',
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <X color="rgb(161, 161, 170)" size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: 0
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'rgb(113, 113, 122)',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Start a conversation with AI Assistant
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: msg.sender === 'user' 
                          ? 'linear-gradient(to right, rgb(220, 38, 38), rgb(239, 68, 68))' 
                          : 'rgba(39, 39, 42, 0.8)',
                        color: 'white',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordWrap: 'break-word'
                      }}
                    >
                      {msg.isImage && msg.imageUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{msg.text.replace(' - Add to Canvas', '')}</span>
                          </div>
                          <img 
                            src={msg.imageUrl} 
                            alt="Generated image" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              objectFit: 'cover'
                            }} 
                          />
                          {msg.canAddToCanvas && (
                            <button
                              onClick={() => handleAddToCanvas(msg.imageUrl!, msg.id)}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, rgb(16, 185, 129), rgb(5, 150, 105))';
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              Add to Canvas
                            </button>
                          )}
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(39, 39, 42, 0.8)',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    <span>●</span> <span>●</span> <span>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderTop: '1px solid rgba(39, 39, 42, 0.5)',
              flexShrink: 0
            }}>
              <textarea
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={activeButton === 'img' ? "Describe the image you want to generate..." : "Type your message here..."}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  lineHeight: '1.5',
                  minHeight: '60px',
                  maxHeight: '120px',
                  color: 'rgb(244, 244, 245)',
                  scrollbarWidth: 'none',
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(39, 39, 42, 0.05), transparent)',
                  pointerEvents: 'none'
                }}
              ></div>
            </div>

            {/* Controls Section */}
            <div style={{ padding: '0 16px 16px 16px', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Character Counter */}
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgb(113, 113, 122)' }}>
                    <span>{charCount}</span>/<span style={{ color: 'rgb(161, 161, 170)' }}>{maxChars}</span>
                  </div>

                  {/* Send Button */}
                  <button 
                    onClick={handleSend}
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(to right, rgb(220, 38, 38), rgb(239, 68, 68))',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      color: 'white',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(39, 39, 42, 0.5)',
                fontSize: '12px',
                color: 'rgb(113, 113, 122)',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={12} />
                  <span>
                    Press <kbd style={{
                      padding: '2px 6px',
                      background: 'rgb(39, 39, 42)',
                      border: '1px solid rgb(82, 82, 91)',
                      borderRadius: '4px',
                      color: 'rgb(161, 161, 170)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>Shift + Enter</kbd> for new line
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'rgb(34, 197, 94)',
                    borderRadius: '50%'
                  }}></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* Floating Overlay */}
            <div 
              style={{ 
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                pointerEvents: 'none',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent, rgba(147, 51, 234, 0.1))' 
              }}
            ></div>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes ping {
          0%, 75%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .floating-ai-button:hover {
          transform: scale(1.1) rotate(5deg) !important;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.9), 0 0 50px rgba(124, 58, 237, 0.7), 0 0 70px rgba(109, 40, 217, 0.5) !important;
        }
        
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
    </>
  );
};

export { FloatingAiAssistant };

