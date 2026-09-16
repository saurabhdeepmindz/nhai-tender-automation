@echo off
REM ===========================================================================
REM NHAI - Check Service Status
REM Quick script to verify all services are running
REM ===========================================================================

title NHAI - Service Status Check
color 0B

echo.
echo ============================================================
echo  NHAI SERVICE STATUS CHECK
echo ============================================================
echo.

REM Check if ports are listening
echo [1/2] Checking Listening Ports...
echo.
netstat -ano | findstr ":3000 :3001 :8000 :8001" | findstr LISTENING
echo.

REM Check URLs via PowerShell
echo [2/2] Checking Service URLs...
echo.
powershell -Command "& { $urls = @( @{Name='Backend API'; Url='http://localhost:3000/api/docs'}, @{Name='Frontend'; Url='http://localhost:3001'}, @{Name='Screen 7'; Url='http://localhost:8000/docs'}, @{Name='Screen 8'; Url='http://localhost:8001/docs'}, @{Name='Admin Panel'; Url='http://localhost:3001/admin/vectorization-control'} ); foreach ($item in $urls) { try { $response = Invoke-WebRequest -Uri $item.Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop; Write-Host ('OK: ' + $item.Name + ' - ' + $item.Url) -ForegroundColor Green } catch { Write-Host ('FAIL: ' + $item.Name + ' - ' + $item.Url) -ForegroundColor Red } } }"

echo.
echo ============================================================
echo  STATUS CHECK COMPLETE
echo ============================================================
echo.
echo Service URLs:
echo  - Backend API: http://localhost:3000/api/docs
echo  - Frontend: http://localhost:3001
echo  - Admin Panel: http://localhost:3001/admin/vectorization-control  
echo  - Screen 7: http://localhost:8000/docs
echo  - Screen 8: http://localhost:8001/docs
echo.
pause
