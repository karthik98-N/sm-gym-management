@echo off
echo Starting SM Gym Frontend (Standalone)...
start cmd /k "cd frontend && npm run dev"

echo The application is launching in a new terminal window!
echo Please wait a moment, then open this URL in your browser: http://127.0.0.1:3000
pause
