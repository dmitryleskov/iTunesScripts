@echo off
set version=0.93
if exist dist rmdir /s /q dist
mkdir dist
call src\utf8to16\build.bat
"C:\Program Files (x86)\Pandoc\bin\pandoc.exe" -s -t plain -o dist\README.txt README.md
"C:\Program Files (x86)\Pandoc\bin\pandoc.exe" -s --html5 -o dist\README.html README.md
for %%i in (AddFLACs.bat AddFLACs.js COPYING.MIT COPYING.GPL bin\flac.exe bin\metaflac.exe) do copy %%i dist
cd dist
if exist ..\AddFLACs-%version%.zip del ..\AddFLACs-%version%.zip
zip ..\AddFLACs-%version%.zip *
