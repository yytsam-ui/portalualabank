@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "APP_URL=http://localhost:9000/login"
set "APP_PORT=9000"
set "DB_PORT=9432"

echo.
echo ==========================================
echo   Portal Uala Bank - Local Launcher
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm no esta disponible en PATH.
  exit /b 1
)

if not exist ".env" (
  echo [INFO] No existe .env. Copiando desde .env.example...
  copy /Y ".env.example" ".env" >nul
)

if not exist ".local-postgres\data-utf8\PG_VERSION" (
  echo [INFO] Inicializando PostgreSQL local del proyecto...
  call npm run db:local:init
  if errorlevel 1 (
    echo [ERROR] Fallo la inicializacion de PostgreSQL local.
    exit /b 1
  )
)

echo [INFO] Verificando PostgreSQL local en puerto %DB_PORT%...
powershell -NoProfile -Command ^
  "$ready = Test-NetConnection -ComputerName localhost -Port %DB_PORT% -WarningAction SilentlyContinue; if ($ready.TcpTestSucceeded) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [INFO] Iniciando PostgreSQL local del proyecto...
  call npm run db:local:start
  if errorlevel 1 (
    echo [ERROR] No se pudo iniciar PostgreSQL local.
    exit /b 1
  )
  timeout /t 3 /nobreak >nul
)

echo [INFO] Asegurando base de datos...
call npm run db:local:createdb >nul 2>nul

echo [INFO] Aplicando migraciones...
call npx prisma migrate deploy
if errorlevel 1 (
  echo [ERROR] Fallaron las migraciones.
  exit /b 1
)

echo [INFO] Generando cliente Prisma...
call npm run prisma:generate >nul
if errorlevel 1 (
  echo [ERROR] Fallo prisma generate.
  exit /b 1
)

echo [INFO] Seed de datos demo...
call npm run db:seed
if errorlevel 1 (
  echo [ERROR] Fallo el seed.
  exit /b 1
)

echo [INFO] Verificando app en puerto %APP_PORT%...
powershell -NoProfile -Command ^
  "$ready = Test-NetConnection -ComputerName localhost -Port %APP_PORT% -WarningAction SilentlyContinue; if ($ready.TcpTestSucceeded) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [INFO] Iniciando app en nueva ventana...
  start "Portal Uala Bank" cmd /k "cd /d ""%ROOT%"" && npm run dev"
  timeout /t 8 /nobreak >nul
) else (
  echo [INFO] La app ya esta corriendo en %APP_PORT%.
)

set "CHROME_EXE="
for %%I in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if exist %%~I (
    set "CHROME_EXE=%%~I"
    goto :open_browser
  )
)

for /f "delims=" %%I in ('where chrome 2^>nul') do (
  set "CHROME_EXE=%%~I"
  goto :open_browser
)

:open_browser
if defined CHROME_EXE (
  echo [INFO] Abriendo Chrome...
  start "" "%CHROME_EXE%" "%APP_URL%"
) else (
  echo [WARN] No encontre Chrome. Abriendo navegador por defecto...
  start "" "%APP_URL%"
)

echo.
echo [OK] Portal listo en %APP_URL%
echo [OK] Credenciales demo: admin@demo.com / Demo1234!
echo.
exit /b 0
