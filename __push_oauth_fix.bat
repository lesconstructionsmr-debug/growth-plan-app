@echo off
cd /d "C:\Users\WARRIORS666\erp-construction"
git add app/auth/callback/page.tsx
git commit -m "fix(auth): prevent double exchangeCodeForSession + expose real error msg"
git push origin main
echo.
echo Push completed! Press any key to close.
pause
