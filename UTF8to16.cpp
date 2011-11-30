//
// UTF8to16.cpp - convert a Unicode text stream from UTF-8 to UTF-16
//
// Version: 0.9
//
// Refer to the file COPYING.BSD for licensing conditions.
//
// Copyright (c) 2011 Dmitry Leskov. All rights reserved.
//

#define _CRT_SECURE_CPP_OVERLOAD_STANDARD_NAMES 1

#include <fcntl.h>
#include <io.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
	wchar_t buf[1024];
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