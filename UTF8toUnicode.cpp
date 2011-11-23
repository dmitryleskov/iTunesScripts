#include <windows.h>
#include <stdio.h>

int main(int argc, char* argv[]) {
	char in[1024];
	WCHAR wBuf[1024];
	if (argc < 2) {
		puts("Usage: UTF8toUnicode out <in");
		exit(1);
	}
	FILE *outfile = fopen(argv[1], "wb");
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
			puts("Error");
			exit(1);
			if (err == ERROR_NO_UNICODE_TRANSLATION) { // Not UTF-8
				puts(in);
				continue;
			}
			else exit(err);
		}
		else {
			// Do not write the zero terminator
			fwrite(wBuf, sizeof(WCHAR), wLen-1, outfile);
			fwrite(L"\x000d\x000a", sizeof(WCHAR), 2, outfile);
		}
	}
}