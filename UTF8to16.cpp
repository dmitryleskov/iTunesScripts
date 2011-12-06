//
// UTF8to16.cpp - convert a Unicode text stream from UTF-8 to UTF-16
//
// Limitation: input stream may not contain lines longer than 1024 bytes
//
// Version: 0.9
//
// Refer to the file COPYING.BSD for licensing conditions.
//
// Copyright (c) 2011 Dmitry Leskov. All rights reserved.
//

#define _CRT_SECURE_CPP_OVERLOAD_STANDARD_NAMES 1
#include <crtdbg.h>  // For _CrtSetReportMode

#include <fcntl.h>
#include <io.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void invalidParameterHandler(
	const wchar_t* expression,
	const wchar_t* function,
	const wchar_t* file,
	unsigned int line,
	uintptr_t pReserved) {
#ifdef _DEBUG
	fwprintf(stderr, L"Invalid parameter detected in function %s."
		L" File: %s Line: %d\n", function, file, line);
	fwprintf(stderr, L"Expression: %s\n", expression);
#else
	fputws(L"Invalid parameter detected (buffer overflow?), aborting.", stderr);
#endif
}

int main(void) {
	wchar_t buf[1024];
	_invalid_parameter_handler oldHandler, newHandler;
	newHandler = invalidParameterHandler;
	oldHandler = _set_invalid_parameter_handler(newHandler);
	// Disable the message box for assertions when linked with debug CRT library.
	_CrtSetReportMode(_CRT_ASSERT, 0);

	if (_setmode(_fileno(stdin), _O_U8TEXT) == -1) {
		perror("Cannot set stdin to UTF-8");
		exit(1);
	}
	if (_setmode(_fileno(stdout), _O_U16TEXT) == -1) {
		perror("Cannot set stdout to Unicode");
		exit(1);
	}
	while (_getws(buf)) {
		if (wcschr(buf, L'\xfffd')) {
			fprintf(stderr, "Error: Input stream not in UTF-8\n");
			exit(1);
		}
		_putws(buf);
	}
}