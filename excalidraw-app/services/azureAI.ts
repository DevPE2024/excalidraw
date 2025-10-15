/**
 * Azure AI Foundry Integration Service
 * Handles communication with Azure AI services (GPT-4o and FLUX)
 */

// Types
export interface AzureGPT4OMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AzureGPT4ORequest {
  messages: AzureGPT4OMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  model?: string;
}

export interface AzureGPT4OResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AzureFLUXGenerateRequest {
  prompt: string;
  n?: number;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  output_format?: "png" | "jpeg" | "webp";
}

export interface AzureFLUXEditRequest {
  image: File | Blob;
  prompt: string;
  n?: number;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}

export interface AzureFLUXResponse {
  created: number;
  data: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
}

// Configuration
const getConfig = () => ({
  gpt4o: {
    endpoint: import.meta.env.VITE_APP_AZURE_GPT4O_ENDPOINT,
    key: import.meta.env.VITE_APP_AZURE_GPT4O_KEY,
  },
  flux: {
    endpoint: import.meta.env.VITE_APP_AZURE_FLUX_ENDPOINT,
    editEndpoint: import.meta.env.VITE_APP_AZURE_FLUX_EDIT_ENDPOINT,
    key: import.meta.env.VITE_APP_AZURE_FLUX_KEY,
  },
});

// Utility: Check if Azure AI is configured
export const isAzureAIConfigured = (): boolean => {
  const config = getConfig();
  return !!(
    config.gpt4o.endpoint &&
    config.gpt4o.key &&
    config.flux.endpoint &&
    config.flux.key
  );
};

// GPT-4o Service
export class AzureGPT4OService {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.endpoint = config.gpt4o.endpoint || "";
    this.apiKey = config.gpt4o.key || "";

    if (!this.endpoint || !this.apiKey) {
      console.warn("Azure GPT-4o not configured. Please set environment variables.");
    }
  }

  async chat(request: AzureGPT4ORequest): Promise<AzureGPT4OResponse> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error("Azure GPT-4o is not configured");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
        messages: request.messages,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature || 0.7,
        top_p: request.top_p || 1,
        model: request.model || "gpt-4o",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure GPT-4o API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async generateDiagramFromText(prompt: string): Promise<string> {
    const response = await this.chat({
      messages: [
        {
          role: "system",
          content: `You are an expert at creating Excalidraw diagrams. 
Convert user descriptions into valid Excalidraw JSON format.
Return ONLY valid JSON, no explanations.
Use appropriate shapes, arrows, and text elements.
Keep it clean and professional.`,
        },
        {
          role: "user",
          content: `Create an Excalidraw diagram for: ${prompt}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  async improveDrawing(description: string, imageDataURL: string): Promise<string> {
    const response = await this.chat({
      messages: [
        {
          role: "system",
          content: `You are an expert at improving diagrams and drawings.
Analyze the image and description, then suggest improvements.
Provide clear, actionable suggestions.`,
        },
        {
          role: "user",
          content: `Image description: ${description}\nImage data: ${imageDataURL.substring(0, 100)}...\n\nSuggest improvements for this drawing.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }
}

// FLUX Image Generation Service
export class AzureFLUXService {
  private endpoint: string;
  private editEndpoint: string;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.endpoint = config.flux.endpoint || "";
    this.editEndpoint = config.flux.editEndpoint || "";
    this.apiKey = config.flux.key || "";

    if (!this.endpoint || !this.apiKey) {
      console.warn("Azure FLUX not configured. Please set environment variables.");
    }
  }

  async generateImage(request: AzureFLUXGenerateRequest): Promise<AzureFLUXResponse> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error("Azure FLUX is not configured");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        n: request.n || 1,
        size: request.size || "1024x1024",
        output_format: request.output_format || "png",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure FLUX API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async editImage(request: AzureFLUXEditRequest): Promise<AzureFLUXResponse> {
    if (!this.editEndpoint || !this.apiKey) {
      throw new Error("Azure FLUX edit is not configured");
    }

    const formData = new FormData();
    formData.append("image", request.image);
    formData.append("prompt", request.prompt);
    formData.append("n", String(request.n || 1));
    formData.append("size", request.size || "1024x1024");

    const response = await fetch(this.editEndpoint, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure FLUX Edit API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async generateImageFromBase64(b64json: string): Promise<Blob> {
    const binary = atob(b64json);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/png" });
  }
}

// Export singleton instances
export const azureGPT4O = new AzureGPT4OService();
export const azureFLUX = new AzureFLUXService();

