#ifndef UNICODE
#define UNICODE
#endif

#include <windows.h>
#include <stdio.h>
#include <fcntl.h>
#include <io.h>

int main(void) {
	char in[1024];
	WCHAR wBuf[1024];
	if (_setmode(_fileno(stdout), _O_U16TEXT) == -1) {
		perror("Cannot set stdout to Unicode");
		exit(1);
	}
	if (_setmode(_fileno(stderr), _O_U16TEXT) == -1) {
		perror("Cannot set stderr to Unicode");
		exit(1);
	}
	while (gets(in)) {
		int wLen =
			MultiByteToWideChar(
			CP_UTF8,
			MB_ERR_INVALID_CHARS,
			in,
			-1,
			wBuf,
			1024);
		if (!wLen) { 
			DWORD err = GetLastError();
			LPWSTR msg;
			if(FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER |
				FORMAT_MESSAGE_FROM_SYSTEM,
				NULL,
				err,
				MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
				(LPWSTR)&msg,
				0,
				NULL) == 0) {
			    fwprintf(stderr, L"Unknown error 0x%x\n", err);
		    }
			fwprintf(stderr, msg);
			exit(1);
		}
		else {
			_putws(wBuf);
		}
	}
}