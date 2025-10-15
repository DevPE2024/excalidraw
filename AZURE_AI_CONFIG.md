# 🔐 Configuração Azure AI Foundry - Affinify Canvas

## 📋 Variáveis de Ambiente

Crie um arquivo `.env.development` na raiz do projeto `excalidraw-affinify/` com o seguinte conteúdo:

```bash
# Azure AI Foundry GPT-4o
VITE_APP_AZURE_GPT4O_ENDPOINT=https://affinify-foundry-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview
VITE_APP_AZURE_GPT4O_KEY=YOUR_AZURE_GPT4O_KEY_HERE

# Azure AI Foundry FLUX (Image Generation)
VITE_APP_AZURE_FLUX_ENDPOINT=https://affinify-foundry-resource.services.ai.azure.com/openai/deployments/FLUX.1-Kontext-pro/images/generations?api-version=2025-04-01-preview
VITE_APP_AZURE_FLUX_EDIT_ENDPOINT=https://affinify-foundry-resource.cognitiveservices.azure.com/openai/deployments/FLUX.1-Kontext-pro/images/edits?api-version=2025-04-01-preview
VITE_APP_AZURE_FLUX_KEY=YOUR_AZURE_FLUX_KEY_HERE

# Excalidraw Plus Link
VITE_APP_PLUS_LP=https://plus.excalidraw.com

# Tracking (disabled in development)
VITE_APP_ENABLE_TRACKING=false
VITE_APP_DISABLE_SENTRY=true
```

## 🚀 Como Usar

### 1. Criar o arquivo .env.development

```bash
cd Affinify_Canvas/excalidraw-affinify
# Copie o conteúdo acima para .env.development
```

### 2. Instalar dependências

```bash
yarn install
```

### 3. Iniciar em modo desenvolvimento

```bash
yarn start
```

## 🎨 Funcionalidades Disponíveis

### GPT-4o (Chat)
- ✅ Gerar diagramas a partir de texto
- ✅ Melhorar desenhos existentes
- ✅ Sugestões inteligentes

### FLUX (Geração de Imagens)
- ✅ Gerar imagens a partir de prompts
- ✅ Editar imagens existentes
- ✅ Tamanhos: 1024x1024, 1792x1024, 1024x1792
- ✅ Formatos: PNG, JPEG, WebP

## 🧪 Testar a Configuração

Execute o seguinte comando no PowerShell para testar:

```powershell
$headers = @{ 
  "Content-Type" = "application/json"
  "api-key" = "YOUR_AZURE_GPT4O_KEY_HERE" 
}
$body = @{ 
  messages = @(@{ 
    role = "user"
    content = "Hello!" 
  })
  max_tokens = 100
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://affinify-foundry-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview" -Method POST -Headers $headers -Body $body
```

## 📚 Documentação

- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [FLUX Model Documentation](https://learn.microsoft.com/azure/ai-studio/)

---

**Criado para Affinify Canvas - Outubro 2025**

