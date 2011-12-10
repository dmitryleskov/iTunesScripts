@echo off

rem
rem Visual Studio 2008 build script. May work for VS 2005 too.
rem

if not exist "%vs90comntools%\vsvars32.bat" goto novc
call "%vs90comntools%\vsvars32.bat"
if not exist "%vcinstalldir%\vcpackages\vcbuild.exe" goto novc

"%vcinstalldir%\vcpackages\vcbuild.exe" %~dp0UTF8to16.sln "Release|Win32"
if %errorlevel% neq 0 goto quit
copy %~dp0\Release\UTF8to16.exe %~dp0\..\..\dist
"%vcinstalldir%\vcpackages\vcbuild.exe" /c %~dp0UTF8to16.sln "Release|Win32"
rmdir %~dp0Release
goto quit

:novc
Echo Cannot locate Visual C++
exit 1

:quit