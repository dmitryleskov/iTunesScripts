@echo off
for /l %%i in (1,1,10) do (
    echo %%i
    copy ..\dummy.flac dummy%%i.flac
    if errorlevel 1 goto :eof
    copy ..\dummy.txt dummy%%i.txt
    if errorlevel 1 goto :eof
    echo TITLE=!!! AddFLACs test title %%i>> dummy%%i.txt
    echo TRACKNUMBER=%%i>> dummy%%i.txt
    ..\..\bin\metaflac --import-tags-from=dummy%%i.txt --no-utf8-convert dummy%%i.flac
    if errorlevel 1 goto :eof
)
call ..\..\dist\addflacs
if errorlevel 1 goto :eof
del /q *.flac *.txt