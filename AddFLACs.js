//
// AddFLACs.js - add FLAC audio files to iTunes media library
//
// Version: 0.91
//
// Refer to the file COPYING.MIT for licensing conditions.
//
// Copyright (c) 2011-2013, Dmitry Leskov. All rights reserved.
//

function debug(s) {
    if (debug) WScript.Echo(s)
}

function log(s) {
    if (verbose) WScript.Echo(s)
}

function warning(s) {
    WScript.Echo('WARNING: '+s)
}

function waitForCompletion(status) {
    var tn = status.TrackName
    if (tn) WScript.StdOut.Write(tn)
    while (status.InProgress) {
        var percentile = Math.round(status.ProgressValue/status.MaxProgressValue*100)
        WScript.StdOut.Write("..."+percentile+"%")
        WScript.Sleep(500)
    }
    if (status.Tracks != null) {
        WScript.Echo(" Done!")
        return status.Tracks.Item(1)
    } else {
        WScript.Echo(" Conversion failed")
        return null
    }
}

//
// As there is no way in JScript to determine what is the ANSI codepage
// or whether the given Unicode character belongs to it,
// I had to create this little hack - write the string to a temporary 
// text file in ANSI mode, read it back and compare with the original.
//
function isANSIString(s) {
    var tempPathname = fso.BuildPath(tempFolderPath, fso.GetTempName())
    var tempFile = fso.CreateTextFile(tempPathname, true)
    tempFile.Write(s)
    tempFile.Close()
    
    tempFile = fso.OpenTextFile(
        tempPathname, 
        1,           // For reading
        false,       // Do not create if absent
        0)           // ANSI
    var probe = tempFile.ReadLine()
    tempFile.Close()
    fso.DeleteFile(tempPathname)
    return probe == s
}

var verbose = true
var debug = false
WScript.Interactive = true

var WSH = new ActiveXObject("WScript.Shell")
var fso = new ActiveXObject("Scripting.FileSystemObject")

var homeFolder  = fso.GetFile(WScript.ScriptFullName).ParentFolder
var flacEXE     = fso.BuildPath(homeFolder, "flac.exe")
var metaflacEXE = fso.BuildPath(homeFolder, "metaflac.exe")
var utf8to16EXE = fso.BuildPath(homeFolder, "UTF8to16.exe")

var src = fso.GetFolder(".")

var args = WScript.Arguments
WScript.Echo(args.length)

for (var i = 0; i < args.length; i++) {
    WScript.Echo(i+":"+args(i))
    if (args(i).charAt(0) != "-") {
        src = fso.GetFolder(args(i))
    }
}

function pad(d) {return d < 10 ? "0"+d : d}

var today = new Date()
var sessionName = 
        fso.GetBaseName(WScript.ScriptName)+"-"+
        today.getFullYear()+"-"+
        pad(today.getMonth()+1)+"-"+
        pad(today.getDate())+"-"+
        pad(today.getHours())+"-"+
        pad(today.getMinutes())+"-"+
        pad(today.getSeconds())

var sysTempFolder = fso.GetSpecialFolder(2) // 2 - TemporaryFolder
var tempFolderPath = fso.BuildPath(sysTempFolder.Path, sessionName)
log("Creating folder "+tempFolderPath+" for storing temporary files")
fso.CreateFolder(tempFolderPath)

try {
    log("Connecting to iTunes COM server...")
    var iTunesApp = WScript.CreateObject("iTunes.Application")
} catch (e) {
    WScript.Echo("iTunes COM server did not respond. Close iTunes and run this script again.")
    WScript.Echo("Error Message: " + e.message)
    WScript.Echo("Error Code: " + e.number & 0xFFFF)
    WScript.Echo("Error Name: " + e.name)
    WScript.Quit(1)
}

var iTunesLibrary = iTunesApp.LibraryPlaylist;

var savedEncoder = iTunesApp.CurrentEncoder
if (savedEncoder.Name != "Lossless Encoder") {
    log("Current Encoder: "+savedEncoder.Name)
    var encoders = new Enumerator(iTunesApp.Encoders)
    for (encoders.moveFirst(); !encoders.atEnd(); encoders.moveNext()) {
        var encoder = encoders.item()
        if (encoder.Name == "Lossless Encoder")
            iTunesApp.CurrentEncoder = encoder
    }
}

log("Importing FLAC files from "+src.Name)

function Traverse(folder) {
    log("Scanning folder "+folder.Path)
    var files = new Enumerator(folder.Files)
    folderScanLoop:
    for (files.moveFirst(); !files.atEnd(); files.moveNext()) {
        file = files.item()
        if (/.flac$/i.test(file.Name)) {
            log("Found FLAC file "+file.Path)

            // WshShell.Exec() is not Unicode-aware. Any non-ANSI characters
            // in its argument will get mangled. This workaround determines
            // if there are any non-ANSI characters in the full pathname 
            // of the FLAC file.
            if (!isANSIString(file.Path)) {
                log("File name contains non-ANSI characters")
                var tempFLACPath = fso.BuildPath(tempFolderPath, 'temp.flac')
                fso.CopyFile(file.Path, tempFLACPath, true)
                sourcePath = tempFLACPath
            } else {
                sourcePath = file.Path
            }

            log("Extracting metadata from "+sourcePath)
            var tempMetadataPath = fso.BuildPath(tempFolderPath, 'temp.meta')
            exec = WSH.Exec('cmd /c ""'+metaflacEXE+'"'+
                            ' --export-tags-to=-'+
                            ' --no-utf8-convert'+
                            ' "'+sourcePath+'"'+
                            ' | "'+utf8to16EXE+'"'+
                            ' > "'+tempMetadataPath+'""')
            while (exec.Status == 0) {
                WScript.Sleep(100)
            }

            var metadataFile = fso.OpenTextFile(tempMetadataPath,1,false,-1)
            var metadata = metadataFile.ReadAll()
            metadataFile.Close()

            var tags = []
            metadata = metadata.split(/\r\n|\r|\n/)
            for (var i in metadata) {
                var pair = metadata[i].match(/(.+?)=(.+)/)
                if (pair) {
                    switch(pair[1].toUpperCase()) {
                    case 'ARTIST':
                        tags['Artist'] = pair[2]
                        break
                    case 'TITLE':
                        tags['Title'] = pair[2]
                        break
                    case 'ALBUM':
                        tags['Album'] = pair[2]
                        break
                    case 'DATE':
                        tags['Date'] = pair[2]
                        break
                    case 'TRACKNUMBER':
                        // Assume track numbers cannot have more than 3 digits
                        if (/^[0-9]{1,3}$/.test(pair[2])) {
                            // Tracks 1-9 would often have a leading zero,
                            // which Javascript used to interpret as radix 8
                            // in the good old days.
                            tags['TrackNumber'] = parseInt(pair[2], 10)
                        } else {
                            warning("Not a valid track number: '" + pair[2] + "', ignoring")
                        }
                        break
                    case 'GENRE':
                        tags['Genre'] = pair[2]
                        break
                    case 'COMPILATION':
                        // I have not seen many samples of this tag,
                        // in fact EAC added COMPILATION=1 only for one
                        // of my compilation CDs. So I will assume for now
                        // that it is the valid way to mark compilations
                        tags['Compilation'] = pair[2] != 0
                        break
                    case 'COMMENT':
                        break
                    default:
                        log("Unrecognized meta tag: "+pair[1])
                        break
                    }
                }
            }

            if (!('Title' in tags && 'Album' in tags && 'Artist' in tags)) {
                WScript.Echo("No track title, album, or artist in metadata, skipping")
                continue folderScanLoop;
            }

            var similar = iTunesLibrary.Search(tags.Title, 5)
            if (similar) {
                for (i = 1; i<= similar.Count; i++) {
                    var track = similar.Item(i)
                    if (track.Name   == tags.Title &&
                        track.Album  == tags.Album &&
                        track.Artist == tags.Artist) {
                        warning("Track already in library, skipping")
                        continue folderScanLoop;
                    }
                }
            }

            var tempWAVPath = fso.BuildPath(tempFolderPath, 'temp.wav')
            log("Decompressing FLAC file into "+tempWAVPath)

            exec = WSH.Exec('"'+flacEXE+'" -s -d -o "'+tempWAVPath+'" "'+sourcePath+'"')
            while (exec.Status == 0) {
                WScript.Sleep(100)
            }
            
            log("Converting WAV file to iTunes track")
            var track = waitForCompletion(iTunesApp.ConvertFile2(tempWAVPath))
            var trackLocation = track.Location

            log("Writing metadata")
            if ('Artist' in tags) track.Artist = tags.Artist
            if ('Title' in tags) track.Name = tags.Title
            if ('Album' in tags) track.Album = tags.Album
            if ('Genre' in tags) track.Genre = tags.Genre
            if ('TrackNumber' in tags) track.TrackNumber = tags.TrackNumber
            if ('Date' in tags) track.Year = tags.Date
            if ('Compilation' in tags) track.Compilation = tags.Compilation != 0

            //
            // As there was no metadata in the intermediate WAV file,
            // the file containing the track was stored 
            // under "Unknown Artist\Unknown Album" subfolder of the iTunes library. 
            // If the option "Keep iTunes Media folder organized" is NOT set 
            // under Preferences/Advanced, setting the metadata have not 
            // caused iTunes to move the file to the appropriate subfolder.
            // Converting the track again will do the trick.
            // Only the metadata will be different in the resulting file.
            //
            if (track.Location == trackLocation) {
                log("Re-converting the track to force rename and relocation")
                waitForCompletion(iTunesApp.ConvertTrack2(track))
                log("Deleting intermediate track")
                var tempTrackPath = track.Location
                track.Delete()
                if (fso.FileExists(tempTrackPath))
                    fso.DeleteFile(tempTrackPath)
            }
            log("Deleting temporary WAV file")
            fso.DeleteFile(tempWAVPath)
        }
    }
    var subfolders = new Enumerator(folder.SubFolders)
    for(subfolders.moveFirst(); !subfolders.atEnd(); subfolders.moveNext()) {
        Traverse(subfolders.item())
    }
}

Traverse(src)

log("Removing temporary folder "+tempFolderPath)
fso.DeleteFolder(tempFolderPath)
