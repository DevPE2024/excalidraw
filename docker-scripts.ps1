# docker-scripts.ps1 - Scripts para Windows

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'dev-detach', 'prod', 'prod-detach', 'stop', 'logs-dev', 'logs-prod', 'restart-dev', 'restart-prod', 'clean')]
    [string]$Command
)

switch ($Command) {
    'dev' {
        Write-Host "🚀 Iniciando Affinify Canvas em modo DESENVOLVIMENTO..." -ForegroundColor Green
        docker-compose -f docker-compose.dev.yml up --build
    }
    
    'dev-detach' {
        Write-Host "🚀 Iniciando Affinify Canvas em modo DESENVOLVIMENTO (background)..." -ForegroundColor Green
        docker-compose -f docker-compose.dev.yml up -d --build
    }
    
    'prod' {
        Write-Host "🏭 Iniciando Affinify Canvas em modo PRODUÇÃO..." -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml up --build
    }
    
    'prod-detach' {
        Write-Host "🏭 Iniciando Affinify Canvas em modo PRODUÇÃO (background)..." -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml up -d --build
    }
    
    'stop' {
        Write-Host "🛑 Parando containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.prod.yml down
    }
    
    'logs-dev' {
        Write-Host "📋 Logs do DEV..." -ForegroundColor Blue
        docker-compose -f docker-compose.dev.yml logs -f
    }
    
    'logs-prod' {
        Write-Host "📋 Logs do PROD..." -ForegroundColor Blue
        docker-compose -f docker-compose.prod.yml logs -f
    }
    
    'restart-dev' {
        Write-Host "🔄 Reiniciando DEV..." -ForegroundColor Magenta
        docker-compose -f docker-compose.dev.yml restart
    }
    
    'restart-prod' {
        Write-Host "🔄 Reiniciando PROD..." -ForegroundColor Magenta
        docker-compose -f docker-compose.prod.yml restart
    }
    
    'clean' {
        Write-Host "🧹 Limpando containers e volumes..." -ForegroundColor Red
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
    }
}

