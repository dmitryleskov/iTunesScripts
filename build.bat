@echo off
if not exist "%vs90comntools%\vsvars32.bat" goto novc
call "%vs90comntools%\vsvars32.bat"
if not exist "%vcinstalldir%\vcpackages\vcbuild.exe" goto novc

"%vcinstalldir%\vcpackages\vcbuild.exe" UTF8to16.sln "Release|Win32"
if %errorlevel% neq 0 goto quit
copy Release\UTF8to16.exe
"%vcinstalldir%\vcpackages\vcbuild.exe" /c UTF8to16.sln "Release|Win32"
goto quit

:novc
Echo Cannot locate Visual C++
exit 1

:quit