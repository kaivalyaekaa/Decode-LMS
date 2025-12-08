@echo off
echo Starting Ekaa Registration Portal (Both Server and Client)...
echo.
echo Starting Server in a new window...
start "Ekaa Server" cmd /k "cd server && node server.js"
timeout /t 3 /nobreak >nul
echo.
echo Starting Client in a new window...
start "Ekaa Client" cmd /k "cd client && npx vite"
echo.
echo Both Server and Client started!
echo Server: http://localhost:5000
echo Client: http://localhost:3000
pause
