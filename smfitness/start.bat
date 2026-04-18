@echo off
echo Starting SM Fitness Console...
start cmd /k "cd smfitness && npm run dev"

echo The application is launching in a new terminal window!
echo Please wait a moment, then open this URL in your browser: http://127.0.0.1:3000
pause
