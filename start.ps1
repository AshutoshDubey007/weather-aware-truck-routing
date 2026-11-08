# Quick startup script for Windows PowerShell
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting Weather-Aware Truck Routing Application " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Django Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process -NoNewWindow powershell -ArgumentList "-Command cd backend; .\venv\Scripts\python.exe manage.py runserver 8000"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location frontend
npm run dev
