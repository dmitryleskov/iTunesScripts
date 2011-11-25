#include <windows.h>
#include <stdio.h>
//#include <fcntl.h>
#include <io.h>

int main(void) {
	char in[1024];
	WCHAR wBuf[1024];
	if (_setmode(_fileno(stdout), _O_U16TEXT) == -1) {
		perror("Cannot set stdout to Unicode");
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
			LPTSTR msg;
			if (FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER |
				FORMAT_MESSAGE_FROM_SYSTEM,
				NULL,
				err,
				MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
				(LPTSTR)&msg,
				0,
				NULL) == 0) {
			    fprintf(stderr, "Unknown error 0x%x\n", err);
			} else {
				CharToOem(msg, msg);  // Would fail if UNICODE is defined
				fprintf(stderr, msg);
			}
			exit(1);
		}
		else {
			_putws(wBuf);
		}
	}
}