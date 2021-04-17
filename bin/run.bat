@echo off
echo.
echo [info] TwelveT Docs is run
echo.

%~d0
cd %~dp0

cd ..
yarn docs:dev

pause