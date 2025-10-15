# 🐳 Affinify Canvas - Docker Setup

## 🚀 Início Rápido

### Desenvolvimento (com hot reload e restart automático)

```bash
# Linux/Mac
./docker-scripts.sh dev

# Windows PowerShell
.\docker-scripts.ps1 dev
```

Acesse: http://localhost:5173

### Produção

```bash
# Linux/Mac
./docker-scripts.sh prod

# Windows PowerShell
.\docker-scripts.ps1 prod
```

Acesse: http://localhost

## 📋 Comandos Disponíveis

### Linux/Mac

```bash
./docker-scripts.sh dev           # Iniciar dev
./docker-scripts.sh dev-detach    # Iniciar dev em background
./docker-scripts.sh prod          # Iniciar prod
./docker-scripts.sh prod-detach   # Iniciar prod em background
./docker-scripts.sh stop          # Parar tudo
./docker-scripts.sh logs-dev      # Ver logs dev
./docker-scripts.sh logs-prod     # Ver logs prod
./docker-scripts.sh restart-dev   # Reiniciar dev
./docker-scripts.sh restart-prod  # Reiniciar prod
./docker-scripts.sh clean         # Limpar tudo
```

### Windows PowerShell

```powershell
.\docker-scripts.ps1 dev
.\docker-scripts.ps1 dev-detach
.\docker-scripts.ps1 prod
.\docker-scripts.ps1 prod-detach
.\docker-scripts.ps1 stop
.\docker-scripts.ps1 logs-dev
.\docker-scripts.ps1 logs-prod
.\docker-scripts.ps1 restart-dev
.\docker-scripts.ps1 restart-prod
.\docker-scripts.ps1 clean
```

## 🔧 Configuração

### Variáveis de Ambiente

O arquivo `docker-compose.dev.yml` já está configurado para conectar com LiteLLM em:
```
http://host.docker.internal:4000/v1/chat/completions
```

### Volumes (DEV)

- `./excalidraw-app` → Hot reload de código
- `./packages` → Pacotes compartilhados
- `./constants` → Configurações
- `node_modules` → Volume Docker

### Portas

- **DEV**: 5173
- **PROD**: 80

## ⚠️ Requisitos

- Docker >= 20.10
- Docker Compose >= 2.0
- LiteLLM rodando em http://localhost:4000 (opcional - para Gemini)

## 🐛 Troubleshooting

### LiteLLM não conecta

Certifique-se que LiteLLM está rodando:
```bash
curl http://localhost:4000/v1/models
```

### Container não inicia

Ver logs:
```bash
./docker-scripts.sh logs-dev
```

### Limpar e recriar

```bash
./docker-scripts.sh clean
./docker-scripts.sh dev
```

## 📚 Documentação Adicional

- [Configuração de IA](./CONFIGURACAO_IA.md)
- [Integração Azure AI](../INTEGRACAO_AZURE_AI.md)
- [README Principal](../README.md)

---

**Desenvolvido para Affinify Canvas - Outubro 2025**

