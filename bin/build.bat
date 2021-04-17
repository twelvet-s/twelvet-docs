@echo off
echo.
echo [info] TwelveT Docs is build
echo.

%~d0
cd %~dp0

cd ..
yarn docs:build

pause