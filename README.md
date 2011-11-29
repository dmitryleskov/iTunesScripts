# AddFLACs #

## NAME ##

AddFLACs - add FLAC files to the iTunes media library

## SYNOPSIS ##

`AddFLACs [`*`FOLDER`*`]`

## DESCRIPTION ##

The **AddFLACs** script scans the specified *FOLDER* and its subfolders
for FLAC files, converts them to Apple lossless format and adds to the
iTunes library.

To avoid track duplication, **AddFLACs** first extracts the metadata from
each FLAC file it encounters and checks if a track with *exactly* the 
same artist, album and title is already present in the iTunes library.
Such tracks will be skipped *even if they are in a different format*.

If *FOLDER* is not specified, the current folder and its subfolders 
will be scanned.

### Prerequisites ###

- FLAC command-line utilities, **flac.exe** and **metaflac.exe**, and
a UTF-8 to UTF-16 conversion helper must be present in the folder 
containing the script.

- All FLAC files must be properly tagged prior to conversion. At a minimum, 
the tags ARTIST, ALBUM, and TITLE must be present. Also recognized are GENRE, 
TRACKNUMBER, DATE, and COMPILATION. 

- If the DATE tag is present, it must contain year only.

## LICENSE ##

The **AddFLACs** script and the Unicode converion helper are released under
the BSD license (see COPYING.BSD.)

The FLAC command-line tools are released under the GPL (see COPYING.GPL.)

## SEE ALSO ##

[Vorbis Comments](http://www.xiph.org/vorbis/doc/v-comment.html)