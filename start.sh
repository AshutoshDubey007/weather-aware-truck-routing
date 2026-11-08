#!/bin/bash
echo "=================================================="
echo " Starting Weather-Aware Truck Routing Application "
echo "=================================================="

# Backend
echo "Starting Django Backend on http://127.0.0.1:8000..."
cd backend
source venv/bin/activate || python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Frontend
echo "Starting Vite React Frontend on http://localhost:5173..."
cd frontend
npm install
npm run dev

kill $BACKEND_PID
