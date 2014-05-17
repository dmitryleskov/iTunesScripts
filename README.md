# AddFLACs #

## NAME ##

AddFLACs - add FLAC files to the iTunes media library

## SYNOPSIS ##

`AddFLACs [`*`options`*`] [`*`FOLDER`*`]`

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

- Unless you specify track, album, and artist names on the command line,
all FLAC files must be properly tagged prior to conversion. At a minimum, 
the tags ARTIST, ALBUM, and TITLE must be present. Also recognized are GENRE, 
TRACKNUMBER, DATE, and COMPILATION. 

- If the DATE tag is present, it must contain year only.

## OPTIONS ##

### Regular expression ###

`-r` *`regular-expression`*  
`--regex` *`regular-expression`*  

This option has dual purpose. First, the tracks that do not match *regular-expression*
are skipped. This enables you to filter out tracks that you do not want to import in this
session. Second, when there is a match, **AddFLACs** attempts to substitute the values
of the *regular-expression* capture groups into the values of *iTunes fields* options
(see below). This helps when your FLAC files are not tagged but hierarchically
organized on disk. (see EXAMPLES.)

*regular-expression* is a JavaScript regular expression, matched in case-insensitive mode
(native Windows filesystems are case-insensitive.)

### Metadata ###

`-`*`itunes-field-name`* *`value`*

Set *`itunes-field-name`* for each track to *`value`*.
You can specify any valid iTunes field. Note that it is preceded by a single dash.
In most cases, you would want to specify several fields, combining them with the
`--regex` option, so as to use capture groups in *value* (see EXAMPLES.)

If the respective value is also present in the FLAC file metadata,
**AddFLACs** will use it by default, ignoring the command-line option.
Use `--override-metadata` or `--ignore-metadata` to change this behavior.


`-i`  
`--ignore-metadata`

Ignore (don't even try to extract) any metadata that may be present in FLAC files.
Requires that you specify at least `-artist`, `-album`, and `-name`.

`-o`  
`--override-metadata`

Values specifies on the command line will override the respective fields
of existing FLAC metadata.

### Other options ###

`-n`  
`--dry-run`  

Do not actually import tracks into iTunes, only show what would be imported.

`-v`  
`--verbose`  

Be verbose about what's going on.

`-d`
`--debug`

Print extra debug information. Useful for debugging regular experessions.

## EXAMPLES ##

`AddFLACs`

Import all FLAC files from the current drectory and its subdirectories (default).

`AddFLACs.bat -n -r ".*\\(.*)\\(.*)\\(.*)\.flac$" -artist "$1" -album "$2" -name "$3"`

Import all FLAC files from the current drectory and its subdirectories.
Assuming their pathnames match the "*Artist*`\`*Album*`\`*Name*`.flac`" pattern,
use the respective capture group instead of *missing* metadata fields, if any.
Do not actually import tracks (re-run without `-n` after verifying that the
fields get extracted as intended.)

    AddFLACs.bat --override-metadata ^
      -artist "The Doors" ^
      -sortartist "Doors, The" ^
      c:\Users\Me\Music\FLAC\Doors

Import all tracks found under `c:\Users\Me\Music\FLAC\Doors`, forcing **Artist** and
**Sort Artist** fields to be set irrespective of what FLAC metadata might contain.
Album and track names will still be extracted from metadata (and hence must be present.)

## LICENSE ##

The **AddFLACs** script and the Unicode conversion helper are released under
the MIT/X11 license (see COPYING.MIT.)

The FLAC command-line tools are released under the GPLv2 (see COPYING.GPL.)
The source code may be obtained from 
[the official FLAC pages on SourceForge](http://flac.sourceforge.net/download.html).

## SEE ALSO ##

[Vorbis Comments](http://www.xiph.org/vorbis/doc/v-comment.html)