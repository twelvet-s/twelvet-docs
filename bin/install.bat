@echo off
echo.
echo [info] TwelveT Docs is being install
echo.

%~d0
cd %~dp0

cd ..
yarn install

pause