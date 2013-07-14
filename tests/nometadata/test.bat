@echo off
copy ..\dummy.flac nometadata.flac
if errorlevel 1 goto :eof
..\..\bin\metaflac --remove-all-tags nometadata.flac
if errorlevel 1 goto :eof
call ..\..\dist\addflacs
if errorlevel 1 goto :eof
del /q *.flac