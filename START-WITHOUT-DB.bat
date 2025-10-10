@echo off
echo ========================================
echo   POS Monitoring System - Simple Start
echo ========================================
echo.

REM Set environment to use memory storage instead of database
set USE_MEMORY_STORAGE=true
set NODE_ENV=development

echo Starting server without database...
echo.

node -e "const express = require('express'); const path = require('path'); const app = express(); app.use(express.static('dist/public')); app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/public/index.html'))); app.listen(5000, () => console.log('Server running on http://localhost:5000'));"

pause
