@echo off
echo Starting QChat Quantum Messenger Full-Stack Services...

echo Ensuring QChat MongoDB is running on port 27018...
docker start qchat_mongo >nul 2>&1 || docker run -d --name qchat_mongo -p 27018:27017 mongo:latest >nul 2>&1

start "QChat QDS Python Service (Port 8000)" cmd /k "cd qds-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak > nul

start "QChat Node.js Backend (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul

start "QChat React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo All services launched!
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:5000
echo - QDS Core: http://localhost:8000

