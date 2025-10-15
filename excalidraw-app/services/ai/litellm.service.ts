// services/ai/litellm.service.ts

import axios from 'axios';
import { APP_CONFIG } from '../../../constants/branding';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

class LiteLLMService {
  private baseURL = APP_CONFIG.LITELLM_ENDPOINT;
  private model = APP_CONFIG.LITELLM_MODEL;
  private apiKey = APP_CONFIG.LITELLM_KEY;

  /**
   * Testar conexão com LiteLLM
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get('http://localhost:4000/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      console.log('✅ LiteLLM conectado:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com LiteLLM:', error);
      return false;
    }
  }

  /**
   * Listar modelos disponíveis
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get('http://localhost:4000/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      const models = response.data.data.map((m: any) => m.id);
      console.log('📋 Modelos disponíveis:', models);
      return models;
    } catch (error) {
      console.error('❌ Erro ao listar modelos:', error);
      return [];
    }
  }

  /**
   * Enviar mensagem para o chat
   */
  async sendMessage(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post<ChatCompletionResponse>(
        this.baseURL,
        {
          model: options?.model || this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log('✅ Resposta IA:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Gerar sugestão de design
   */
  async generateDesignSuggestion(prompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Você é um assistente de design do Affinify Canvas. Ajude os usuários a criar elementos visuais incríveis.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.sendMessage(messages);
    return response.choices[0].message.content;
  }

  /**
   * Melhorar prompt para geração de imagens
   */
  async improveImagePrompt(userPrompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Você é um especialista em criar prompts para geração de imagens. Melhore o prompt do usuário tornando-o mais detalhado e específico.',
      },
      {
        role: 'user',
        content: `Melhore este prompt para geração de imagens: "${userPrompt}"`,
      },
    ];

    const response = await this.sendMessage(messages);
    return response.choices[0].message.content;
  }

  /**
   * Gerar imagem com IA
   * Flexível para diferentes modelos (DALL-E, Stable Diffusion, etc)
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    try {
      const payload = {
        prompt: request.prompt,
        model: request.model || 'dall-e-3', // Modelo padrão (pode mudar)
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        n: request.n || 1,
      };

      console.log('🎨 Gerando imagem com payload:', payload);

      const response = await axios.post<ImageGenerationResponse>(
        'http://localhost:4000/v1/images/generations',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 segundos para geração
        }
      );

      console.log('✅ Imagem gerada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao gerar imagem:', error);
      
      // Mensagem de erro mais detalhada
      if (error.response) {
        throw new Error(
          `Erro na geração: ${error.response.data?.error?.message || error.response.statusText}`
        );
      }
      
      throw new Error('Erro ao conectar com serviço de geração de imagens');
    }
  }

  /**
   * Verificar modelos de imagem disponíveis
   */
  async getAvailableImageModels(): Promise<string[]> {
    try {
      const response = await axios.get('http://localhost:4000/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      // Filtrar modelos que suportam imagens
      const imageModels = response.data.data
        .filter((m: any) => 
          m.id.includes('dall-e') || 
          m.id.includes('stable-diffusion') ||
          m.id.includes('midjourney') ||
          m.capabilities?.includes('image-generation')
        )
        .map((m: any) => m.id);
      
      console.log('🎨 Modelos de imagem disponíveis:', imageModels);
      return imageModels;
    } catch (error) {
      console.error('❌ Erro ao listar modelos de imagem:', error);
      return [];
    }
  }
}

export const liteLLMService = new LiteLLMService();

