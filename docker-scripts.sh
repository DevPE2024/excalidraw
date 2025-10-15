#!/bin/bash

# Scripts de gerenciamento Docker para Affinify Canvas

case "$1" in
  dev)
    echo "🚀 Iniciando Affinify Canvas em modo DESENVOLVIMENTO..."
    docker-compose -f docker-compose.dev.yml up --build
    ;;
    
  dev-detach)
    echo "🚀 Iniciando Affinify Canvas em modo DESENVOLVIMENTO (background)..."
    docker-compose -f docker-compose.dev.yml up -d --build
    ;;
    
  prod)
    echo "🏭 Iniciando Affinify Canvas em modo PRODUÇÃO..."
    docker-compose -f docker-compose.prod.yml up --build
    ;;
    
  prod-detach)
    echo "🏭 Iniciando Affinify Canvas em modo PRODUÇÃO (background)..."
    docker-compose -f docker-compose.prod.yml up -d --build
    ;;
    
  stop)
    echo "🛑 Parando containers..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
    ;;
    
  logs-dev)
    echo "📋 Logs do DEV..."
    docker-compose -f docker-compose.dev.yml logs -f
    ;;
    
  logs-prod)
    echo "📋 Logs do PROD..."
    docker-compose -f docker-compose.prod.yml logs -f
    ;;
    
  restart-dev)
    echo "🔄 Reiniciando DEV..."
    docker-compose -f docker-compose.dev.yml restart
    ;;
    
  restart-prod)
    echo "🔄 Reiniciando PROD..."
    docker-compose -f docker-compose.prod.yml restart
    ;;
    
  clean)
    echo "🧹 Limpando containers e volumes..."
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    ;;
    
  *)
    echo "📖 Uso: ./docker-scripts.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev           - Iniciar em modo desenvolvimento"
    echo "  dev-detach    - Iniciar dev em background"
    echo "  prod          - Iniciar em modo produção"
    echo "  prod-detach   - Iniciar prod em background"
    echo "  stop          - Parar todos os containers"
    echo "  logs-dev      - Ver logs do dev"
    echo "  logs-prod     - Ver logs do prod"
    echo "  restart-dev   - Reiniciar dev"
    echo "  restart-prod  - Reiniciar prod"
    echo "  clean         - Limpar containers e volumes"
    ;;
esac

